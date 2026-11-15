export type CreateTopicSuggestionInput = {
  fieldId?: number;
  semesterId?: number;
  title: string;
  description?: string;
  maxSlots?: number;
  isPublished?: boolean;
};

export type UpdateTopicSuggestionInput = {
  fieldId?: number;
  semesterId?: number;
  title?: string;
  description?: string;
  maxSlots?: number;
  isPublished?: boolean;
};
