import torch
import numpy as np
from app.autoencoder_model import GRUAutoencoder


def load_autoencoder_model(model_path, input_size=18, hidden_size=64, latent_size=32, seq_len=10):
    """Load GRU Autoencoder for inference."""
    model = GRUAutoencoder(
        input_size=input_size,
        hidden_size=hidden_size,
        latent_size=latent_size,
        seq_len=seq_len
    )
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()
    return model


def load_threshold(threshold_path):
    """Load saved reconstruction threshold."""
    return float(np.load(threshold_path))


def predict_risk(model, threshold, sequence):
    """
    Predict dropout risk using a GRU Autoencoder.
    sequence: shape (10, 18)
    """

    # Validate input
    seq = np.array(sequence, dtype=np.float32)
    if seq.shape != (10, 18):
        raise ValueError("Input sequence must be shape (10, 18)")

    seq_tensor = torch.tensor(seq).unsqueeze(0)  # (1, 10, 18)

    with torch.no_grad():
        reconstructed, _ = model(seq_tensor)

        # Compute reconstruction error
        error = torch.mean((seq_tensor - reconstructed) ** 2).item()

    risk_level = "HIGH" if error > threshold else "LOW"

    return {
        "reconstruction_error": float(error),
        "threshold": float(threshold),
        "risk_level": risk_level
    }
