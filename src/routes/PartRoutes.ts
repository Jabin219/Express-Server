import HttpStatusCodes from '@src/constants/HttpStatusCodes';
import { IReq, IRes } from './types/express/misc';
import PartModel from '@src/mongodb/models/part';

// **** Functions **** //

const addParts = async (req: IReq, res: IRes) => {
  const { resultJson, year, make, model, type, engine } = req.body
  let parts = resultJson.partsdata || []
  if (typeof parts === 'object' && !Array.isArray(parts)) {
    parts = [parts]
  }
  try {
    const partsToAdd = parts.map(async (part: any) => {
      const filteredPart = { ...part }
      delete filteredPart.part_no
      delete filteredPart.supplier
      delete filteredPart.part_type
      delete filteredPart.qty
      delete filteredPart.application
      delete filteredPart.location
      delete filteredPart.brand
      const existingPart = await PartModel.findOne({
        partNumber: part.part_no['#text'],
        application: part.application['#text'] || '',
        supplier: part.supplier['#text'],
        location: part.location['#text'] || '',
        brand: part.brand['#text'] || '',
        year,
        make,
        model,
        type,
        engine
      })
      if (!existingPart) {
        const newPart = {
          year,
          make,
          model,
          type,
          engine,
          partNumber: part.part_no['#text'],
          application: part.application['#text'] || '',
          supplier: part.supplier['#text'],
          partType: part.part_type['#text'],
          qty: part.qty['#text'],
          location: part.location['#text'] || '',
          brand: part.brand['#text'] || '',
          othersByJson: JSON.stringify({ ...filteredPart })
        }
        return newPart
      } else {
        console.log(`Skipping duplicate partNumber: ${part.part_no['#text']}`)
        return null
      }
    })
    const results = await Promise.all(partsToAdd)
    const newParts = results.filter(
      (part: any) => part !== null && part !== undefined
    )
    const partsResult = await PartModel.insertMany(newParts)
    return res
      .status(HttpStatusCodes.OK)
      .json({ success: true, parts: partsResult })
  } catch (error) {
    console.error(error)
  }
}

// 获取最新的零件数据
const getLatestParts = async (req: IReq, res: IRes) => {
  try {
    // 查询数据库中最近创建的 10 条零件记录
    const latestParts = await PartModel.find()
      .sort({ createdAt: -1 }) // 按 createdAt 字段降序排列
      .limit(1);               // 限制返回的记录数

    // 打印最近的零件记录
    console.log('Latest parts:', latestParts);

    return res.status(HttpStatusCodes.OK).json({ success: true, latestParts });
  } catch (error) {
    console.error('Error occurred while fetching latest parts:', error);
    return res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'An error occurred while fetching latest parts.' });
  }
};

// **** Export default **** //

export default {
  addParts,
  getLatestParts,
} as const;