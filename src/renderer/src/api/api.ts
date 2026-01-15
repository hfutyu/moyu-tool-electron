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
