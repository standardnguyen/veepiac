#!/usr/bin/env python3
"""
Script to clean up expired media files
Can be scheduled as a cron job or Windows scheduled task
"""

import os
import sys
import logging
from pathlib import Path

# Add the parent directory to the path so we can import the application modules
parent_dir = Path(__file__).resolve().parent
sys.path.append(str(parent_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename=os.path.join(parent_dir, 'cleanup.log')
)

# Import the cleanup function from utils
from utils import cleanup_expired_media

if __name__ == "__main__":
    # Run the cleanup
    cleanup_expired_media()
