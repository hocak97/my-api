import { columnModel } from '~/models/columnModel';
import { boardModel } from '~/models/boardModel';
import { cardModel } from '~/models/cardModel';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';


const createNew = async (reqBody) => {
  try {
    const newColumn = {
      ...reqBody,
    };

    const createdColumn = await columnModel.createNew(newColumn);
    const getNewColumn = await columnModel.findOneById(createdColumn.insertedId);

    if (getNewColumn) {
      getNewColumn.cards = [];
      await boardModel.pushColumOrderIds(getNewColumn);
    }
    return getNewColumn;
  } catch (error) {
    throw error;
  }
};

const update = async (columnId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updateAt: Date.now(),
    };
    const updatedColumn = await columnModel.update(columnId, updateData);
    return updatedColumn;
  } catch (error) {
    throw error;
  }
};

const deleteItem = async (columnId) => {
  try {
    const targetColumn = await columnModel.findOneById(columnId);
    if (!targetColumn) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Không tìm thấy cột");
    }
    await boardModel.pullColumOrderIds(targetColumn);
    await columnModel.deleteOneById(columnId);
    await cardModel.deleteManyByColumnId(columnId);


    return { deleteResult: 'Hàng và cột đã được xóa!' };
  } catch (error) {
    throw error;
  }
};
export const columnService = {
  createNew,
  update,
  deleteItem
};