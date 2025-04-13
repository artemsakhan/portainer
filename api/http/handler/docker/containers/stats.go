package containers

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/middlewares"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/rs/zerolog/log"
	"io"
	"net/http"
)

type MyContainerStats struct {
	CID   string          `json:"cid"`
	Stats container.Stats `json:"stats"`
}

func (h *Handler) containerStatsSSE(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// Allow CORS
	w.Header().Set("Access-Control-Allow-Origin", "*") // or use r.Header.Get("Origin") and check allowed origins
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Transfer-Encoding", "chunked")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return nil
	}

	// Let client know we're connected
	fmt.Fprintf(w, "event: open\ndata: connected\n\n")
	flusher.Flush()

	agentTargetHeader := r.Header.Get(portainer.PortainerAgentTargetHeader)

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("Unable to find an environment on request context", err)
	}

	dockerCli, err := h.dockerClientFactory.CreateClient(endpoint, agentTargetHeader, nil)
	if err != nil {
		return httperror.NewError(500, "failed to init docker client", err)
	}
	defer dockerCli.Close()

	// Filters to fetch only running containers
	containers, err := dockerCli.ContainerList(r.Context(), container.ListOptions{
		All: false, // Set All to false to only get running containers
	})
	if err != nil {
		return httperror.NewError(500, "failed to list containers", err)
	}

	log.Warn().Msg(fmt.Sprintf("[STREAM] got containers: %d", len(containers)))

	statsCh := make(chan MyContainerStats)
	errCh := make(chan error)

	for _, c := range containers {
		go streamStats(r.Context(), dockerCli, c.ID, statsCh, errCh)
	}

	for {
		select {
		case <-r.Context().Done():
			return nil
		case err := <-errCh:
			log.Error().Msgf("[STREAM] error stream: %v", err)
			fmt.Fprintf(w, "event: error\ndata: %s\n\n", err.Error())

			flusher.Flush()
		case containerMetrics := <-statsCh:
			log.Warn().Msgf("[STREAM] flushing stats")

			contentBytes, err := json.Marshal(containerMetrics)
			if err != nil {
				log.Error().Msgf("[STREAM] failed to marshal container metrics: %v", err)
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", string(contentBytes))

			flusher.Flush()
		}
	}
}

func streamStats(ctx context.Context, dockerCli *client.Client, cid string, statsCh chan MyContainerStats, errCh chan<- error) {
	stats, err := dockerCli.ContainerStats(ctx, cid, true)
	if err != nil {
		if !errors.Is(err, context.Canceled) {
			errCh <- errors.Wrapf(err, "error getting container stats for container %s", cid)
		}
		return
	}
	defer stats.Body.Close()

	decoder := json.NewDecoder(stats.Body)

	for {
		var decodedStats container.Stats
		if err := decoder.Decode(&decodedStats); err != nil {
			if err == io.EOF {
				break
			}
			errCh <- errors.Wrap(err, "error decoding container stats")
			return
		}

		statsCh <- MyContainerStats{
			CID:   cid,
			Stats: decodedStats,
		}
	}
}
