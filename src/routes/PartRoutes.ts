import HttpStatusCodes from '@src/constants/HttpStatusCodes'
import { IReq, IRes } from './types/express/misc'
import { xmlParser } from '@src/util'
import PartModel from '@src/mongodb/models/part'

// **** Functions **** //

const addParts = async (req: IReq, res: IRes) => {
  const { xmlString } = req.body
  try {
    console.log('step 1')
    const parts = xmlParser(xmlString).partsdata
    if (parts) {
      parts.forEach(async (part: any) => {
        const filteredPart = { ...part }
        delete filteredPart.part_no
        delete filteredPart.supplier
        delete filteredPart.part_type
        delete filteredPart.qty
        const existingPart = await PartModel.findOne({
          partNumber: part.part_no['#text']
        })
        console.log('step 2')
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
        console.log('step 3')
      })
      console.log('step 4')
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
