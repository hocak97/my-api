import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators';
import { getBd } from '~/config/mongodb';
import { BOARD_TYPE } from '~/utils/constants';
import { columnModel } from '~/models/columnModel';
import { cardModel } from '~/models/cardModel';


const BOARD_COLLECTION_NAME = 'boards';
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().min(3).max(256).trim().strict(),
  type: Joi.string().valid(BOARD_TYPE.PUBLIC, BOARD_TYPE.PRIVATE).required(),
  columnOrderIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
});

const INVALID_UPDATE_FIELDS = ['_id', 'createAt'];

const validCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false });
};

const createNew = async (data) => {
  try {
    const validData = await validCreate(data);
    const createdBoard = await getBd().collection(BOARD_COLLECTION_NAME).insertOne(validData);

    return createdBoard;
  } catch (error) {
    throw new Error(error);
  }
};

const findOneById = async (boardId) => {
  try {
    const result = await getBd().collection(BOARD_COLLECTION_NAME).findOne({
      _id: new ObjectId(boardId),
    });
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const getDetails = async (id) => {
  try {
    const result = await getBd().collection(BOARD_COLLECTION_NAME).aggregate([
      { $match: {
        _id: new ObjectId(id),
        _destroy: false,
      } },
      { $lookup: {
        from: columnModel.COLUMN_COLLECTION_NAME,
        localField: '_id',
        foreignField: 'boardId',
        as: 'columns'
      } },
      {
        $lookup: {
          from: cardModel.CARD_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'cards'
        } },

    ]).toArray();
    // const result = await getBd().collection(BOARD_COLLECTION_NAME).findOne({
    //   _id: new ObjectId(id),
    // });
    return result[0] || null;
  } catch (error) {
    throw new Error(error);
  }
};

const pushColumOrderIds = async (column) => {
  try {
    const result = await getBd().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(column.boardId) },
      { $push: { columnOrderIds: new ObjectId(column._id) } },
      { returnDocument: 'after' }
    );
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const update = async (boardId, updateData) => {
  try {
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName];
      }
    });

    if (updateData.columnOrderIds) {
      updateData.columnOrderIds = updateData.columnOrderIds.map(id => (new ObjectId(id)));
    }

    const result = await getBd().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(boardId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

const pullColumOrderIds = async (column) => {
  try {
    const result = await getBd().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(column.boardId) },
      { $pull: { columnOrderIds: new ObjectId(column._id) } },
      { returnDocument: 'after' }
    );
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  pushColumOrderIds,
  update,
  pullColumOrderIds
};