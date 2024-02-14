import HttpStatusCodes from '@src/constants/HttpStatusCodes'
import { IReq, IRes } from './types/express/misc'
import { xmlParser } from '@src/util'
import PartModel from '@src/mongodb/models/part'

// **** Functions **** //

const addParts = async (req: IReq, res: IRes) => {
  const { xmlString } = req.body
  const parts = xmlParser(xmlString).partsdata || []
  try {
    if (parts) {
      // 如果parts是一个对象，处理单个部件
      if (typeof parts === 'object' && !Array.isArray(parts)) {
        const part = parts
        const filteredPart = { ...part }
        delete filteredPart.part_no
        delete filteredPart.supplier
        delete filteredPart.part_type
        delete filteredPart.qty
        const existingPart = await PartModel.findOne({
          partNumber: part.part_no['#text']
        })
        if (!existingPart) {
          try {
            const newPart = new PartModel({
              partNumber: part.part_no['#text'],
              supplier: part.supplier['#text'],
              partType: part.part_type['#text'],
              qty: part.qty['#text'],
              othersByJson: JSON.stringify({ ...filteredPart })
            })
            await newPart.save()
          } catch (error) {
            console.log(
              `Skipping duplicate partNumber: ${part.part_no['#text']}`
            )
          }
        } else {
          console.log(`Skipping duplicate partNumber: ${part.part_no['#text']}`)
        }
      } else if (Array.isArray(parts)) {
        // 如果parts是一个数组，按照原先的逻辑处理多个部件
        parts.forEach(async (part: any) => {
          const filteredPart = { ...part }
          delete filteredPart.part_no
          delete filteredPart.supplier
          delete filteredPart.part_type
          delete filteredPart.qty
          const existingPart = await PartModel.findOne({
            partNumber: part.part_no['#text']
          })
          if (!existingPart) {
            try {
              const newPart = new PartModel({
                partNumber: part.part_no['#text'],
                supplier: part.supplier['#text'],
                partType: part.part_type['#text'],
                qty: part.qty['#text'],
                othersByJson: JSON.stringify({ ...filteredPart })
              })
              await newPart.save()
            } catch (error) {
              console.log(
                `Skipping duplicate partNumber: ${part.part_no['#text']}`
              )
            }
          } else {
            console.log(
              `Skipping duplicate partNumber: ${part.part_no['#text']}`
            )
          }
        })
      }
      return res.status(HttpStatusCodes.OK).json({ success: true })
    } else {
      return res.status(HttpStatusCodes.OK)
    }
  } catch (error) {
    console.log(parts)
    console.error(error)
  }
}

// **** Export default **** //

export default {
  addParts
} as const
