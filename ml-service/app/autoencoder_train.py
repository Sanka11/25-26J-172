# import torch
# import torch.nn as nn
# import numpy as np
# from torch.utils.data import DataLoader, TensorDataset

# from app.data_preprocess import load_and_preprocess
# from app.autoencoder_model import GRUAutoencoder


# def train_autoencoder():
#     print("📌 Loading dataset...")
#     X = load_and_preprocess("app/data/dataset.csv", mode="train")

#     loader = DataLoader(TensorDataset(X), batch_size=32, shuffle=True)

#     model = GRUAutoencoder()
#     optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
#     loss_fn = nn.MSELoss()

#     print("🚀 Training...")
#     for epoch in range(20):
#         total = 0
#         for (batch,) in loader:
#             optimizer.zero_grad()
#             recon, _ = model(batch)
#             loss = loss_fn(recon, batch)
#             loss.backward()
#             optimizer.step()
#             total += loss.item()
#         print(f"Epoch {epoch+1}/20 | Loss={total:.4f}")

#     torch.save(model.state_dict(), "app/autoencoder_model.pth")
#     print("💾 Model saved.")

#     # ---------- thresholds ----------
#     model.eval()
#     errors = []

#     with torch.no_grad():
#         for (batch,) in loader:
#             recon, _ = model(batch)
#             err = torch.mean((batch - recon) ** 2, dim=(1, 2))
#             errors.extend(err.numpy())

#     errors = np.array(errors)
#     p50 = np.percentile(errors, 50)
#     p75 = np.percentile(errors, 75)

#     np.save("app/threshold_p50.npy", p50)
#     np.save("app/threshold_p75.npy", p75)

#     print(f"LOW/NORMAL cutoff: {p50}")
#     print(f"NORMAL/HIGH cutoff: {p75}")


# if __name__ == "__main__":
#     train_autoencoder()
