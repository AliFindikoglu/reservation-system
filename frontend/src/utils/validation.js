export function validateName(value) {
    if (!value.trim()) return "Full name is required.";
    if (value.trim().length < 3) return "Full name must be at least 3 characters long.";
    return "";
}

export function validateEmail(value){
    if(!value) return "Email is required.";

    if(!value.endsWith("@eteration.com"))
        return "Please use your work email.";

    return "";
}

export function validatePhone(value){

    const phoneRegex = /^(\+90|0)?5\d{9}$/;

    if(!value) return "Phone number is required.";

    if(!phoneRegex.test(value.replace(/\s/g, "")))
        return "Please enter a valid Turkish phone number.";

    return "";
}

export function validatePassword(value){
    if(!value) return "Password is required.";
    
    if(value.length < 8)
        return "Password must be at least 8 characters.";

    return "";
}

export function validateConfirmPassword(password, confirmPassword){
    if(!confirmPassword)
        return "Please confirm your password.";

    if(password !== confirmPassword)
        return "Passwords do not match.";
    
    return "";
}

export function validateCurrentPassword(value){
    if(!value)
        return "Current password is required"

    return "";
}

export function formatName(value) {
    return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("tr")
    .split(" ")
    .map(
        word =>
            word.charAt(0).toLocaleUpperCase("tr") + word.slice(1)
    )
    .join(" ");
}