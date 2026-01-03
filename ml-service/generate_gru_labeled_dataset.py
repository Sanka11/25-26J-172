import pandas as pd
from app.autoencoder_predict import predict_single_student


# INPUT dataset (your original dataset)
INPUT_DATASET = "data/student_behavior.csv"

# OUTPUT dataset (new, GRU-labeled)
OUTPUT_DATASET = "data/gru_labeled_dataset.csv"


def main():
    df = pd.read_csv(INPUT_DATASET)

    results = []

    for _, row in df.iterrows():
        student_id = row["student_id"]

        # GRU prediction (NO changes to GRU)
        prediction = predict_single_student(row.to_dict())

        labeled_row = row.to_dict()
        labeled_row["reconstruction_error"] = prediction["error"]
        labeled_row["risk"] = prediction["risk"]

        results.append(labeled_row)

    labeled_df = pd.DataFrame(results)
    labeled_df.to_csv(OUTPUT_DATASET, index=False)

    print("✅ GRU-labeled dataset generated:", OUTPUT_DATASET)


if __name__ == "__main__":
    main()
