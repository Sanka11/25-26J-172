# import torch
# import torch.nn as nn


# class GRUEncoder(nn.Module):
#     def __init__(self, input_size=18, hidden_size=64, latent_size=32):
#         super().__init__()

#         self.gru = nn.GRU(
#             input_size=input_size,
#             hidden_size=hidden_size,
#             batch_first=True
#         )
#         self.fc = nn.Linear(hidden_size, latent_size)

#     def forward(self, x):
#         _, hidden = self.gru(x)
#         hidden = hidden[-1]
#         return self.fc(hidden)


# class GRUDecoder(nn.Module):
#     def __init__(self, latent_size=32, hidden_size=64, output_size=18, seq_len=10):
#         super().__init__()
#         self.seq_len = seq_len
#         self.fc = nn.Linear(latent_size, hidden_size)

#         self.gru = nn.GRU(
#             input_size=hidden_size,
#             hidden_size=hidden_size,
#             batch_first=True
#         )
#         self.out = nn.Linear(hidden_size, output_size)

#     def forward(self, latent):
#         hidden = torch.relu(self.fc(latent))
#         repeated = hidden.unsqueeze(1).repeat(1, self.seq_len, 1)
#         out, _ = self.gru(repeated)
#         return self.out(out)


# class GRUAutoencoder(nn.Module):
#     def __init__(self, input_size=18, hidden_size=64, latent_size=32, seq_len=10):
#         super().__init__()
#         self.encoder = GRUEncoder(input_size, hidden_size, latent_size)
#         self.decoder = GRUDecoder(latent_size, hidden_size, input_size, seq_len)

#     def forward(self, x):
#         z = self.encoder(x)
#         recon = self.decoder(z)
#         return recon, z
