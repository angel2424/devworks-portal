export type DeliverableType = "form" | "decision";

export type DeliverableStatus =
  | "draft"
  | "published"
  | "submitted"
  | "approved"
  | "archived";

export type FieldType = "text" | "long_text" | "date" | "image" | "file";

export type DeliverableField = {
  id: string;
  label: string;
  hint: string | null;
  field_type: FieldType;
  required: boolean;
  order_index: number;
};

export type DeliverableOption = {
  id: string;
  label: string;
  description: string | null;
  order_index: number;
};

export type DeliverableFieldResponse = {
  id: string;
  field_id: string;
  value_text: string | null;
  value_file_url: string | null;
  value_file_name: string | null;
  responded_by: string;
};

export type DeliverableDecisionResponse = {
  id: string;
  option_id: string | null;
  comment: string | null;
  responded_by: string;
};

export type DeliverableListItem = {
  id: string;
  type: DeliverableType;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  published_at: string | null;
  submitted_at: string | null;
  created_at: string;
  fields: { id: string }[];
  options: { id: string }[];
};

export type DeliverableDetail = {
  id: string;
  set_id: string;
  type: DeliverableType;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  published_at: string | null;
  submitted_at: string | null;
  created_at: string;
  fields: DeliverableField[];
  options: DeliverableOption[];
  field_responses: DeliverableFieldResponse[];
  decision_responses: DeliverableDecisionResponse[];
};

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const DELIVERABLE_STATUS_LABEL: Record<DeliverableStatus, string> = {
  draft:     "Borrador",
  published: "Publicado",
  submitted: "Respondido",
  approved:  "Aprobado",
  archived:  "Archivado",
};

export const DELIVERABLE_STATUS_COLOR: Record<DeliverableStatus, string> = {
  draft:     "bg-gray-100 text-gray-500 border-gray-200",
  published: "bg-blue-50 text-blue-700 border-blue-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200",
  approved:  "bg-green-50 text-green-700 border-green-200",
  archived:  "bg-gray-100 text-gray-400 border-gray-200",
};

export const DELIVERABLE_TYPE_LABEL: Record<DeliverableType, string> = {
  form:     "Solicitud de datos",
  decision: "Decisión",
};

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text:      "Texto corto",
  long_text: "Texto largo",
  date:      "Fecha",
  image:     "Imagen",
  file:      "Archivo",
};
