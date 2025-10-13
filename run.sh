#!/bin/bash

# AI4Voice Portal - Complete Full-Stack Project Runner Script
# This script sets up and runs both the Next.js frontend and Python FastAPI backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Screen session name
SCREEN_SESSION="ai4voice_portal"
FRONTEND_SCREEN="ai4voice_frontend"
BACKEND_SCREEN="ai4voice_backend"

# PID files for process management
FRONTEND_PID_FILE="/tmp/ai4voice_frontend.pid"
BACKEND_PID_FILE="/tmp/ai4voice_backend.pid"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher"
            return 1
        fi
    else
        print_error "Node.js is not installed"
        return 1
    fi
}

# Function to check npm version
check_npm_version() {
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm version $NPM_VERSION is available"
        return 0
    else
        print_error "npm is not installed"
        return 1
    fi
}

# Function to check Python version
check_python_version() {
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        MAJOR_VERSION=$(echo $PYTHON_VERSION | cut -d'.' -f1)
        MINOR_VERSION=$(echo $PYTHON_VERSION | cut -d'.' -f2)
        if [ "$MAJOR_VERSION" -ge 3 ] && [ "$MINOR_VERSION" -ge 8 ]; then
            print_success "Python version $PYTHON_VERSION is compatible"
            return 0
        else
            print_error "Python version $PYTHON_VERSION is too old. Please install Python 3.8 or higher"
            return 1
        fi
    else
        print_error "Python3 is not installed"
        return 1
    fi
}

# Function to check pip version
check_pip_version() {
    if command_exists pip3; then
        PIP_VERSION=$(pip3 --version | cut -d' ' -f2)
        print_success "pip version $PIP_VERSION is available"
        return 0
    else
        print_error "pip3 is not installed"
        return 1
    fi
}

# Function to check if screen is installed
check_screen() {
    if command_exists screen; then
        SCREEN_VERSION=$(screen -v | cut -d' ' -f3)
        print_success "screen version $SCREEN_VERSION is available"
        return 0
    else
        print_error "screen is not installed. Installing screen..."
        sudo apt-get update && sudo apt-get install -y screen
        return $?
    fi
}

# Function to kill existing processes
kill_existing_processes() {
    print_status "Checking for existing processes..."
    
    # Kill frontend processes
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            print_status "Killing existing frontend process (PID: $FRONTEND_PID)..."
            kill -TERM $FRONTEND_PID 2>/dev/null || true
            sleep 2
            kill -KILL $FRONTEND_PID 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Kill backend processes
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            print_status "Killing existing backend process (PID: $BACKEND_PID)..."
            kill -TERM $BACKEND_PID 2>/dev/null || true
            sleep 2
            kill -KILL $BACKEND_PID 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Kill any remaining Node.js processes on port 3000
    if lsof -ti:3000 >/dev/null 2>&1; then
        print_status "Killing processes on port 3000..."
        lsof -ti:3000 | xargs kill -TERM 2>/dev/null || true
        sleep 2
        lsof -ti:3000 | xargs kill -KILL 2>/dev/null || true
    fi
    
    # Kill any remaining Python processes on port 9010
    if lsof -ti:9010 >/dev/null 2>&1; then
        print_status "Killing processes on port 9010..."
        lsof -ti:9010 | xargs kill -TERM 2>/dev/null || true
        sleep 2
        lsof -ti:9010 | xargs kill -KILL 2>/dev/null || true
    fi
    
    # Kill any screen sessions
    screen -wipe >/dev/null 2>&1 || true
    if screen -list | grep -q "$FRONTEND_SCREEN"; then
        print_status "Terminating existing frontend screen session..."
        screen -S "$FRONTEND_SCREEN" -X quit 2>/dev/null || true
    fi
    if screen -list | grep -q "$BACKEND_SCREEN"; then
        print_status "Terminating existing backend screen session..."
        screen -S "$BACKEND_SCREEN" -X quit 2>/dev/null || true
    fi
    
    print_success "Existing processes cleaned up"
}

# Function to create environment file if it doesn't exist
create_env_file() {
    if [ ! -f ".env.production" ]; then
        print_status "Creating .env.production file with default values..."
        cat > .env.production << EOF
# Grafana Configuration
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3001
GRAFANA_API_KEY=your_grafana_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_NAME=AI4Voice Portal
NEXT_PUBLIC_APP_DESCRIPTION=Grafana Management Application

# Production Configuration
NODE_ENV=production
EOF
        print_warning "Please update .env.production with your actual Grafana configuration"
        print_warning "You need to set NEXT_PUBLIC_GRAFANA_URL and GRAFANA_API_KEY"
    else
        print_success ".env.production file already exists"
    fi
}

# Function to install frontend dependencies
install_frontend_dependencies() {
    print_status "Installing frontend dependencies..."
    
    if [ -f "package-lock.json" ]; then
        print_status "Using npm ci for faster, reliable, reproducible builds..."
        npm ci
    else
        print_status "Using npm install..."
        npm install
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Frontend dependencies installed successfully"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
}

# Function to install backend dependencies
install_backend_dependencies() {
    if [ -d "backend" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        
        # Create virtual environment if it doesn't exist
        if [ ! -d "venv" ]; then
            print_status "Creating Python virtual environment..."
            python3 -m venv venv
        fi
        
        # Activate virtual environment
        print_status "Activating virtual environment..."
        source venv/bin/activate
        
        # Install requirements
        print_status "Installing Python packages..."
        pip install -r requirements.txt
        
        if [ $? -eq 0 ]; then
            print_success "Backend dependencies installed successfully"
        else
            print_error "Failed to install backend dependencies"
            exit 1
        fi
        
        cd ..
    else
        print_warning "Backend directory not found, skipping backend setup"
    fi
}

# Function to run linting
run_linting() {
    print_status "Running ESLint to check code quality..."
    npm run lint
    if [ $? -eq 0 ]; then
        print_success "Linting passed"
    else
        print_warning "Linting found some issues, but continuing..."
    fi
}

# Function to build the project
build_project() {
    print_status "Building the project..."
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Function to start backend server in screen
start_backend_server() {
    if [ -d "backend" ]; then
        print_status "Starting backend server in screen session..."
        cd backend
        
        # Create screen session for backend
        screen -dmS "$BACKEND_SCREEN" bash -c "
            source venv/bin/activate
            echo 'Backend server starting...'
            echo 'Backend will be available at: http://localhost:9010'
            echo 'API Documentation: http://localhost:9010/docs'
            echo 'Press Ctrl+A then D to detach from this screen'
            python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 9010
        "
        
        # Get the PID of the screen session
        BACKEND_PID=$(screen -list | grep "$BACKEND_SCREEN" | cut -d. -f1 | awk '{print $1}')
        echo $BACKEND_PID > "$BACKEND_PID_FILE"
        
        cd ..
        print_success "Backend server started in screen session: $BACKEND_SCREEN"
        return 0
    else
        print_warning "Backend directory not found, skipping backend startup"
        return 1
    fi
}

# Function to start frontend server in screen
start_frontend_server() {
    print_status "Starting frontend server in screen session..."
    
    # Create screen session for frontend
    screen -dmS "$FRONTEND_SCREEN" bash -c "
        echo 'Frontend server starting...'
        echo 'Frontend will be available at: http://localhost:3000'
        echo 'Press Ctrl+A then D to detach from this screen'
        npm run dev
    "
    
    # Get the PID of the screen session
    FRONTEND_PID=$(screen -list | grep "$FRONTEND_SCREEN" | cut -d. -f1 | awk '{print $1}')
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    
    print_success "Frontend server started in screen session: $FRONTEND_SCREEN"
    return 0
}

# Function to start development server
start_dev_server() {
    print_status "Starting full-stack development servers in screen sessions..."
    
    # Kill any existing processes first
    kill_existing_processes
    
    # Start backend first
    start_backend_server
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    start_frontend_server
    
    print_success "Both servers started in screen sessions!"
    print_status "Frontend: http://localhost:3000 (screen: $FRONTEND_SCREEN)"
    print_status "Backend: http://localhost:9010 (screen: $BACKEND_SCREEN)"
    echo ""
    print_status "Screen session management:"
    print_status "  screen -r $FRONTEND_SCREEN  # Attach to frontend"
    print_status "  screen -r $BACKEND_SCREEN   # Attach to backend"
    print_status "  screen -list               # List all sessions"
    print_status "  screen -S <session> -X quit # Kill a session"
    echo ""
    print_status "To stop all servers, run: $0 stop"
}

# Function to stop all servers
stop_servers() {
    print_status "Stopping all servers..."
    kill_existing_processes
    print_success "All servers stopped"
}

# Function to restart servers
restart_servers() {
    print_status "Restarting servers..."
    stop_servers
    sleep 2
    start_dev_server
}

# Function to show server status
show_status() {
    print_status "Server Status:"
    echo ""
    
    # Check frontend
    if screen -list | grep -q "$FRONTEND_SCREEN"; then
        print_success "Frontend: Running (screen: $FRONTEND_SCREEN)"
    else
        print_error "Frontend: Not running"
    fi
    
    # Check backend
    if screen -list | grep -q "$BACKEND_SCREEN"; then
        print_success "Backend: Running (screen: $BACKEND_SCREEN)"
    else
        print_error "Backend: Not running"
    fi
    
    # Check ports
    if lsof -ti:3000 >/dev/null 2>&1; then
        print_success "Port 3000: In use (Frontend)"
    else
        print_error "Port 3000: Free"
    fi
    
    if lsof -ti:9010 >/dev/null 2>&1; then
        print_success "Port 9010: In use (Backend)"
    else
        print_error "Port 9010: Free"
    fi
}

# Function to start production server in screen
start_prod_server() {
    print_status "Starting production server in screen session..."
    print_status "Using .env.production configuration..."
    
    # Copy .env.production to .env.local for Next.js to use
    if [ -f ".env.production" ]; then
        cp .env.production .env.local
        print_success "Using .env.production configuration"
    fi
    
    # Create screen session for frontend production
    screen -dmS "$FRONTEND_SCREEN" bash -c "
        echo 'Production server starting...'
        echo 'Frontend will be available at: http://localhost:3000'
        echo 'Press Ctrl+A then D to detach from this screen'
        npm run start
    "
    
    # Get the PID of the screen session
    FRONTEND_PID=$(screen -list | grep "$FRONTEND_SCREEN" | cut -d. -f1 | awk '{print $1}')
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    
    print_success "Production server started in screen session: $FRONTEND_SCREEN"
    print_status "Frontend: http://localhost:3000 (screen: $FRONTEND_SCREEN)"
    echo ""
    print_status "Screen session management:"
    print_status "  screen -r $FRONTEND_SCREEN  # Attach to frontend"
    print_status "  screen -list               # List all sessions"
    print_status "  screen -S <session> -X quit # Kill a session"
    echo ""
    print_status "To stop all servers, run: $0 stop"
}

# Function to show help
show_help() {
    echo "AI4Voice Portal - Complete Project Runner"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  dev, development    Start full-stack development servers in screen (default)"
    echo "  frontend           Start frontend only in screen"
    echo "  backend            Start backend only in screen"
    echo "  stop               Stop all running servers"
    echo "  restart            Restart all servers"
    echo "  status             Show server status"
    echo "  attach             Attach to running screen sessions"
    echo "  prod, production   Build and start production server"
    echo "  build              Build the project only"
    echo "  lint               Run linting only"
    echo "  install            Install all dependencies"
    echo "  setup              Setup environment and install dependencies"
    echo "  help, -h, --help   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Start development server"
    echo "  $0 dev             # Start development server"
    echo "  $0 prod            # Build and start production server"
    echo "  $0 setup          # Setup environment and install dependencies"
}

# Main script logic
main() {
    print_status "AI4Voice Portal - Starting setup and run process..."
    echo ""

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi

    # Parse command line arguments
    case "${1:-dev}" in
        "dev"|"development")
            MODE="development"
            ;;
        "frontend")
            MODE="frontend"
            ;;
        "backend")
            MODE="backend"
            ;;
        "stop")
            MODE="stop"
            ;;
        "restart")
            MODE="restart"
            ;;
        "status")
            MODE="status"
            ;;
        "attach")
            MODE="attach"
            ;;
        "prod"|"production")
            MODE="production"
            ;;
        "build")
            MODE="build"
            ;;
        "lint")
            MODE="lint"
            ;;
        "install")
            MODE="install"
            ;;
        "setup")
            MODE="setup"
            ;;
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac

    # Check system requirements
    print_status "Checking system requirements..."
    if ! check_node_version; then
        print_error "Please install Node.js 18 or higher"
        exit 1
    fi

    if ! check_npm_version; then
        print_error "Please install npm"
        exit 1
    fi

    # Check Python requirements for backend
    if [ "$MODE" = "development" ] || [ "$MODE" = "backend" ] || [ "$MODE" = "install" ] || [ "$MODE" = "setup" ]; then
        if ! check_python_version; then
            print_error "Please install Python 3.8 or higher"
            exit 1
        fi

        if ! check_pip_version; then
            print_error "Please install pip3"
            exit 1
        fi
    fi

    # Check screen for screen-based modes
    if [ "$MODE" = "development" ] || [ "$MODE" = "frontend" ] || [ "$MODE" = "backend" ] || [ "$MODE" = "stop" ] || [ "$MODE" = "restart" ] || [ "$MODE" = "status" ] || [ "$MODE" = "attach" ]; then
        if ! check_screen; then
            print_error "Please install screen"
            exit 1
        fi
    fi

    # Create environment file
    create_env_file

    # Install dependencies
    if [ "$MODE" = "setup" ] || [ "$MODE" = "development" ] || [ "$MODE" = "production" ] || [ "$MODE" = "build" ] || [ "$MODE" = "install" ] || [ "$MODE" = "frontend" ]; then
        install_frontend_dependencies
    fi

    if [ "$MODE" = "setup" ] || [ "$MODE" = "development" ] || [ "$MODE" = "backend" ] || [ "$MODE" = "install" ]; then
        install_backend_dependencies
    fi

    # Run linting
    if [ "$MODE" = "lint" ]; then
        run_linting
        exit 0
    fi

    # Build project
    if [ "$MODE" = "build" ]; then
        run_linting
        build_project
        print_success "Build completed successfully"
        exit 0
    fi

    # Setup mode
    if [ "$MODE" = "setup" ]; then
        print_success "Setup completed successfully"
        print_status "You can now run:"
        print_status "  $0 dev    # Start development server"
        print_status "  $0 prod   # Start production server"
        exit 0
    fi

    # Stop mode
    if [ "$MODE" = "stop" ]; then
        stop_servers
        exit 0
    fi

    # Restart mode
    if [ "$MODE" = "restart" ]; then
        restart_servers
        exit 0
    fi

    # Status mode
    if [ "$MODE" = "status" ]; then
        show_status
        exit 0
    fi

    # Attach mode
    if [ "$MODE" = "attach" ]; then
        print_status "Available screen sessions:"
        screen -list
        echo ""
        print_status "To attach to a session:"
        print_status "  screen -r $FRONTEND_SCREEN  # Frontend"
        print_status "  screen -r $BACKEND_SCREEN   # Backend"
        exit 0
    fi

    # Frontend only mode
    if [ "$MODE" = "frontend" ]; then
        print_status "Starting frontend only in screen..."
        kill_existing_processes
        start_frontend_server
        print_status "Frontend started in screen session: $FRONTEND_SCREEN"
        print_status "To attach: screen -r $FRONTEND_SCREEN"
        exit 0
    fi

    # Backend only mode
    if [ "$MODE" = "backend" ]; then
        print_status "Starting backend only in screen..."
        kill_existing_processes
        start_backend_server
        print_status "Backend started in screen session: $BACKEND_SCREEN"
        print_status "To attach: screen -r $BACKEND_SCREEN"
        exit 0
    fi

    # Development mode
    if [ "$MODE" = "development" ]; then
        print_status "Starting in development mode..."
        start_dev_server
        exit 0
    fi

    # Production mode
    if [ "$MODE" = "production" ]; then
        print_status "Starting in production mode..."
        run_linting
        build_project
        
        # Kill any existing processes first
        kill_existing_processes
        
        # Start backend first
        start_backend_server
        
        # Wait a moment for backend to start
        sleep 3
        
        # Start frontend production server
        start_prod_server
        
        print_success "Both servers started in screen sessions!"
        print_status "Frontend: http://localhost:3000 (screen: $FRONTEND_SCREEN)"
        print_status "Backend: http://localhost:9010 (screen: $BACKEND_SCREEN)"
        echo ""
        print_status "Screen session management:"
        print_status "  screen -r $FRONTEND_SCREEN  # Attach to frontend"
        print_status "  screen -r $BACKEND_SCREEN   # Attach to backend"
        print_status "  screen -list               # List all sessions"
        print_status "  screen -S <session> -X quit # Kill a session"
        echo ""
        print_status "To stop all servers, run: $0 stop"
    fi
}

# Run main function with all arguments
main "$@"
