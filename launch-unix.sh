#!/bin/bash

# ONGC Internship ATS - Unix Launcher
# Works on macOS and Linux

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}💡 $1${NC}"
}

# Function to show main menu
show_menu() {
    clear
    echo -e "${BLUE}🚀 ONGC Internship ATS - Unix Launcher${NC}"
    echo "================================================"
    echo
    echo "📋 Available commands:"
    echo "   1. setup    - Initial setup and deployment"
    echo "   2. start    - Start all services"
    echo "   3. stop     - Stop all services"
    echo "   4. health   - Check system health"
    echo "   5. dev      - Development mode"
    echo "   6. docker   - Docker management"
    echo "   7. exit     - Exit launcher"
    echo
}

# Function to show Docker submenu
show_docker_menu() {
    clear
    echo -e "${BLUE}🐳 Docker Management${NC}"
    echo "====================="
    echo
    echo "📋 Available commands:"
    echo "   1. up      - Start Docker services"
    echo "   2. down    - Stop Docker services"
    echo "   3. logs    - View Docker logs"
    echo "   4. back    - Back to main menu"
    echo
}

# Function to run command
run_command() {
    local command=$1
    local args=${@:2}
    
    echo "🚀 Running: $command $args"
    echo
    
    if node "$command" $args; then
        print_status "Command completed successfully"
    else
        print_error "Command failed"
    fi
    
    echo
    echo "Press Enter to continue..."
    read
}

# Function to handle Docker commands
handle_docker() {
    while true; do
        show_docker_menu
        read -p "🐳 Docker command: " choice
        
        case $choice in
            1)
                echo "🐳 Starting Docker services..."
                docker-compose up -d
                print_status "Docker services started"
                echo "Press Enter to continue..."
                read
                ;;
            2)
                echo "🐳 Stopping Docker services..."
                docker-compose down
                print_status "Docker services stopped"
                echo "Press Enter to continue..."
                read
                ;;
            3)
                echo "🐳 Viewing Docker logs..."
                docker-compose logs -f
                ;;
            4)
                return
                ;;
            *)
                print_error "Invalid command. Please try again."
                echo "Press Enter to continue..."
                read
                ;;
        esac
    done
}

# Function to handle development mode
handle_dev() {
    echo "🔧 Starting development mode..."
    
    # Start backend in background
    echo "🚀 Starting backend server..."
    cd server && npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start frontend in background
    echo "🚀 Starting frontend server..."
    cd Frontend && npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    print_status "Development mode started"
    echo "🌐 Frontend: http://localhost:5173"
    echo "🔧 Backend: http://localhost:3001"
    echo
    print_info "To stop services, press Ctrl+C"
    echo
    
    # Wait for user to stop
    trap "echo; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
    wait
}

# Main loop
while true; do
    show_menu
    read -p "🚀 Command: " choice
    
    case $choice in
        1)
            run_command "deploy-universal.js"
            ;;
        2)
            run_command "start-universal.js"
            ;;
        3)
            run_command "stop-universal.js"
            ;;
        4)
            run_command "health-check.js"
            ;;
        5)
            handle_dev
            ;;
        6)
            handle_docker
            ;;
        7)
            echo
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid command. Please try again."
            echo "Press Enter to continue..."
            read
            ;;
    esac
done
