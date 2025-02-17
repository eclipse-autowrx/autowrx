import { useParams } from 'react-router-dom'
import useGetPrototype from './useGetPrototype'

const useCurrentInventoryItem = () => {
  const { inventory_id } = useParams()

  if (!inventory_id) {
    return {
      data: null,
    }
  }

  return {
    data: {
      id: '1',
      name: 'ADAS System',
      visibility: 'public',
      type: {
        createdAt: '2021-09-01T00:00:00.000Z',
        updatedAt: '2021-09-01T00:00:00.000Z',
        id: '1rfwe1',
        name: 'System Interface',
        description: 'System Interface',
        schema: {},
      },
      details: {
        name: 'Vehicle.ADAS',
        description: 'Advanced Driver Assistance System',
      },
      image:
        'https://www.bmwgroup.com/en/company/_jcr_content/main/layoutcontainer_1988/columncontrol/columncontrolparsys/globalimage.coreimg.jpeg/1701354503044/720x720-i5er.jpeg',
      created_by: {
        id: '1',
        name: 'Tuan Hoang Dinh Anh',
        image_file: 'https://i.redd.it/3z3lk8ouwjjc1.jpeg',
      },
      createdAt: '2021-09-01T00:00:00.000Z',
      updatedAt: '2021-09-01T00:00:00.000Z',
    },
  }
}

export default useCurrentInventoryItem
