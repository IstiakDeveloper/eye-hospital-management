import PrescriptionPrint from './Print';

// Used by `PrescriptionController@downloadBlankPrescription`.
// Reuse the same printable layout; blank-mode is controlled via `print_metadata.is_blank_prescription`.
export default PrescriptionPrint;
