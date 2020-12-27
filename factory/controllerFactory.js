// own modules
const catchError = require("../utils/catchError");
const AppError = require("../utils/AppError");

exports.deleteOne = (Model) =>
    catchError(async (req, res, next) => {
        const document = await Model.findByIdAndDelete(req.params.id);
        if (!document) {
            return next(new AppError("No document found with that id", 404));
        }
        res.status(204).json({
            status: "success",
            data: null,
        });
    });
