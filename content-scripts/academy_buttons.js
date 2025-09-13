import { addCSS } from "./utils";

export function processAcademyButtons() {
    console.info(`Processing academy buttons...`);

    addCSS(
        `div > button.btn-danger {
        margin-left: 50px !important;
    }`,
        "final-whistle-academy-buttons"
    );
}
