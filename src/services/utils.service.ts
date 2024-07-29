import axios from 'axios'

export const repeatService = async (
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  data: any = {},
) => {
  return (
    await axios.post('https://apiproxy.digitalauto.tech/repeat', {
      url,
      method,
      data,
    })
  ).data
}
