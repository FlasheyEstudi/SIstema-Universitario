import { Role } from "./types";

export const APP_NAME = "UniSystem";

// Nota: Las opciones de Campus ahora se cargan dinámicamente desde la BD.
// Mantenemos una referencia al ID del campus central para lógica de Super Admin.
export const CENTRAL_CAMPUS_CODE = 'CEN';

export const MOCK_DELAY = 400; // Simula latencia de red

export const SEMESTERS = [
    { value: 1, label: "I Cuatrimestre" },
    { value: 2, label: "II Cuatrimestre" },
    { value: 3, label: "III Cuatrimestre" },
    { value: 4, label: "IV Cuatrimestre" },
    { value: 5, label: "V Cuatrimestre" },
    { value: 6, label: "VI Cuatrimestre" }
];