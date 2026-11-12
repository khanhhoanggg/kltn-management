export type CreateFieldInput = {
  name: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateFieldInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};