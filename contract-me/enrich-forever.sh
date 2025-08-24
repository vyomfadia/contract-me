#!/bin/bash

# ContractMe - Auto Enrichment Script
# Runs the enrichment endpoint every second until terminated

echo "Starting ContractMe auto-enrichment..."
echo "Press Ctrl+C to stop"
echo "Running enrichment endpoint every 1 second..."
echo ""

# Trap Ctrl+C to exit gracefully
trap 'echo -e "\nStopping auto-enrichment..."; exit 0' INT

# Counter for tracking runs
counter=0

while true; do
    counter=$((counter + 1))
    echo "Run #$counter - $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Run the enrichment endpoint
    http -A bearer -a abcdmonkey123 post http://localhost:3000/api/enrich
    
    echo ""
    
    # Wait 1 second before next run
    sleep 1
done