class ApiError extends Error{
    constructor(statusCode , message = "Soemthing went wrong"){
        super(message);
        this.statusCode = statusCode
        this.data = null;
        this.success = false
    }
}

export default ApiError;