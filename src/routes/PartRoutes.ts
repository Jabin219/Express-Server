import HttpStatusCodes from '@src/constants/HttpStatusCodes'
import { IReq, IRes } from './types/express/misc'
import { xmlParser } from '@src/util'
import PartModel from '@src/mongodb/models/part'

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

// **** Export default **** //

export default {
  addParts
} as const
