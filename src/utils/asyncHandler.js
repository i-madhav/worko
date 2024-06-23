/*const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(res , req , next))
        .catch((err) => next(err))
    }
}

export default asyncHandler;*/

const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (err) {
            next(err); // Passes the error to the next error-handling middleware
        }
    };
};

export default asyncHandler;
