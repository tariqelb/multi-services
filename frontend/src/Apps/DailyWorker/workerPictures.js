// src/Apps/DailyWorker/workerPictures.js
//
// Default pictures of a worker without photos, by gender:
//   cover  card / page picture when the portfolio has no photo
//   face   round profile picture when the account has no photo

import manCover from "../../assets/workers/default-man.jpg";
import womanCover from "../../assets/workers/default-woman.jpg";
import manFace from "../../assets/workers/default-man-face.jpg";
import womanFace from "../../assets/workers/default-woman-face.jpg";

export const defaultCover = (gender) => (gender === "female" ? womanCover : manCover);

/** "" when the gender is unknown (profiles from before gender existed). */
export const defaultFace = (gender) => (gender === "female" ? womanFace : gender === "male" ? manFace : "");
