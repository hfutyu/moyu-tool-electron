import request from '../utils/request'


export const test = () => {
  return request.get('/ep/overview/day/getBatteryMileageStats?groupType=1')
}
export const test1 = (params: any) => {
  return request({
    method: 'GET',
    url: '/ep/overview/day/getBatteryMileageStats',
    params: params
  })
}
export const test2 = (params: any) => {
  return request({
    method: 'GET',
    url: '/device/location/track',
    params: params
  })
}
export const test3 = (params: any) => {
  return request({
    method: 'GET',
    url: '/device/battery-gps/trace',
    params: params
  })
}
// 通用API请求函数
export const callApi = (
  method: string,
  url: string,
  data?: any,
  headers?: Record<string, string>,
  params?: any
) => {
  const config: any = {
    method,
    url,
    headers: headers || {},
  }

  if (method.toLowerCase() === 'get' || method.toLowerCase() === 'delete') {
    config.params = params
  } else {
    config.data = data
  }

  return request(config)
}
