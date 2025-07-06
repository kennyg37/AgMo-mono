"""Test configuration and fixtures."""

import pytest
import asyncio
import os
import tempfile
from pathlib import Path


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def temp_dir():
    """Create a temporary directory for tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture(autouse=True)
def setup_test_env(temp_dir):
    """Setup test environment variables."""
    os.environ["CHECKPOINTS_DIR"] = str(temp_dir / "checkpoints")
    os.environ["LOGS_DIR"] = str(temp_dir / "logs")
    os.environ["MODELS_DIR"] = str(temp_dir / "models")
    os.environ["DATA_DIR"] = str(temp_dir / "data")
    
    # Create directories
    for dir_name in ["checkpoints", "logs", "models", "data"]:
        (temp_dir / dir_name).mkdir(exist_ok=True)
    
    yield
    
    # Cleanup environment variables
    for var in ["CHECKPOINTS_DIR", "LOGS_DIR", "MODELS_DIR", "DATA_DIR"]:
        os.environ.pop(var, None)