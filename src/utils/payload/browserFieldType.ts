export const FieldInputType = Object.freeze({
    Text: 'text',
    Password: 'password',
    Email: 'email',
} as const);
export type FieldInputType = (typeof FieldInputType)[keyof typeof FieldInputType];

export function getFieldInputType(fieldType: string | undefined): FieldInputType {
    return fieldType === FieldInputType.Password || fieldType === FieldInputType.Email
        ? fieldType
        : FieldInputType.Text;
}
