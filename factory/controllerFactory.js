// own modules
const catchError = require("../utils/catchError");
const AppError = require("../utils/AppError");
const APIFeatures = require("../utils/APIFeatures");

exports.getAll = (Model) =>
    catchError(async (req, res, next) => {
        // for get tourid in reviews
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };
        // get query
        const apiFeatures = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limit()
            .paginate();

        // execute query
        // const docs = await apiFeatures.query.explain();
        const docs = await apiFeatures.query;

        // send response
        res.status(200).json({
            status: "success",
            results: docs.length,
            data: {
                data: docs,
            },
        });
    });

exports.getOne = (Model, populateOptions) =>
    catchError(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (populateOptions) {
            query = query.populate(populateOptions);
        }
        const doc = await query;
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
