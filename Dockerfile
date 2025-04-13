FROM golang:1.23.5 AS builder

# Set the Current Working Directory inside the container
WORKDIR /src

# Install dependencies required for the build
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    yarn \
    jq \
    git \
    bash \
    && rm -rf /var/lib/apt/lists/*


# Copy the local code to the container
COPY . .

# Install Go dependencies if needed
RUN go mod tidy

RUN GOOS=${1:-$(go env GOOS)} GOARCH=${2:-$(go env GOARCH)} CGO_ENABLED=0 go build \
	-trimpath \
	--installsuffix cgo \
	-o ./dist/portainer \
	./api/cmd/portainer/

# Start a new stage from the scratch image to copy the final binary
FROM scratch

# Copy the pre-built binary from the builder stage
COPY --from=builder /src/dist/portainer /portainer

# Set the entrypoint to the portainer binary
ENTRYPOINT ["/portainer"]
