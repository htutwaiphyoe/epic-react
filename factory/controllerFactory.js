// own modules
const catchError = require("../utils/catchError");
const AppError = require("../utils/AppError");

exports.createOne = (Model) =>
    catchError(async (req, res, next) => {
        const doc = await Model.create(req.body);

        res.status(201).json({
            status: "success",
            data: {
                data: doc,
            },
        });
    });

exports.updateOne = (Model) =>
    catchError(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!doc) {
            return next(new AppError("No document found with that id", 404));
        }
        res.status(200).json({
            status: "success",
            data: {
                data: doc,
            },
        });
    });

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
