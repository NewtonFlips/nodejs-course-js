const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

// Alias Route (Route to provide readymade filtering and other things instead of using query)

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields =
    'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(
  async (req, res, next) => {
    const features = new APIFeatures(
      Tour.find(),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query; // As soon as we await the query, the query will execute

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: tours.length,
      data: {
        tours,
      },
    });
  }
);

exports.getTour = catchAsync(
  async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  }
);

exports.createTour = catchAsync(
  async (req, res, next) => {
    const tour = await Tour.create(req.body);
    res.status(201).json({
      status: 'sucess',
      data: {
        tour,
      },
    });
  }
);

exports.updateTour = catchAsync(
  async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  }
);

exports.deleteTour = catchAsync(
  async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(
      req.params.id
    );
    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

// AGGREGATION PIPELINE (grouping results)
exports.getTourStats = catchAsync(
  async (req, res, next) => {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          // _id: '$ratingsAverage',
          _id: { $toUpper: '$difficulty' },
          num: { $sum: 1 },
          numOfRatings: { $sum: '$ratingsQuantity' },
          averageRating: { $avg: '$ratingsAverage' },
          avergePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avergePrice: 1 },
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  }
);

exports.getMonthlyPlan = catchAsync(
  async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          num: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { num: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  }
);
