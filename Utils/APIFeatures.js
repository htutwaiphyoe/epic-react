module.exports = class {
    constructor(query, urlQuery) {
        this.query = query;
        this.urlQuery = urlQuery;
    }

    filter() {
        // Filetering query
        let queryObj = { ...this.urlQuery };
        const execludedFields = ["sort", "page", "limit", "fields"];
        execludedFields.forEach((field) => delete queryObj[field]);

        // Advanced filtering query
        queryObj = JSON.parse(
            JSON.stringify(queryObj).replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`)
        );

        // get query
        this.query = this.query.find(queryObj);

        // return entire object
        return this;
    }

    sort() {
        // sorting
        if (this.urlQuery.sort) {
            this.query = this.query.sort(this.urlQuery.sort.split(",").join(" "));
        } else {
            this.query = this.query.sort("-createdAt");
        }

        // return entire object
        return this;
    }

    limit() {
        // fields limiting
        if (this.urlQuery.fields) {
            this.query = this.query.select(this.urlQuery.fields.split(",").join(" "));
        } else {
            this.query = this.query.select("-__v");
        }

        // return entire object
        return this;
    }

    paginate() {
        // pagination
        const limit = +this.urlQuery.limit || 10;
        const page = +this.urlQuery.page || 1;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);

        // return entire object
        return this;
    }
};
