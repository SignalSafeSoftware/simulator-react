export function getFieldInputType(fieldType: string | undefined): 'text' | 'password' | 'email' {
    return fieldType === 'password' || fieldType === 'email' ? fieldType : 'text';
}
