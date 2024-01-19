import HttpStatusCodes from '@src/constants/HttpStatusCodes'
import { IReq, IRes } from './types/express/misc'
import { xmlParser } from '@src/util'
import PartModel from '@src/mongodb/models/part'

// **** Functions **** //

const addParts = async (req: IReq, res: IRes) => {
  const { xmlString } = req.body
  try {
    const parts = xmlParser(xmlString).partsdata

    if (parts) {
      parts.forEach(async (part: any) => {
        const filteredPart = { ...part }
        delete filteredPart.part_no
        delete filteredPart.supplier
        delete filteredPart.part_type
        delete filteredPart.qty
        try {
          const existingPart = await PartModel.findOne({
            partNumber: part.part_no['#text']
          })

          if (!existingPart) {
            const newPart = new PartModel({
              partNumber: part.part_no['#text'],
              supplier: part.supplier['#text'],
              partType: part.part_type['#text'],
              qty: part.qty['#text'],
              othersByJson: JSON.stringify({ filteredPart })
            })

            await newPart.save()
          } else {
            console.log(
              `Skipping duplicate partNumber: ${part.part_no['#text']}`
            )
          }
        } catch (error) {
          console.error(error)
        }
      })
      return res.status(HttpStatusCodes.OK).json({ success: true })
    } else {
      return res.status(HttpStatusCodes.OK)
    }
  } catch (error) {
    console.error(error)
  }
}

// **** Export default **** //

export default {
  addParts
} as const
