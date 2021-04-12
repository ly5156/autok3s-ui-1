
import {computed, ref, watch} from 'vue'

export default function useAlibabaSdk () {
  const accessKeyId = ref('')
  const accessKeySecret = ref('')

  const regions = ref([])
  const loadRegionError = ref('')
  const regionLoading = ref(false)

  const zones = ref([])
  const loadZoneError = ref('')
  const zoneLoading = ref(false)

  const images = ref([])
  const loadImageError = ref('')
  const imageLoading = ref(false)

  const region = ref('')
  const zone = ref('')
  const instanceType = ref('')

  const instanceTypes = ref([])
  const diskCategories = ref([])

  const vpcs = ref([])
  const loadVpcError = ref('')
  const vpcLoading = ref(false)
  const vpc = ref('')

  const vSwitches = ref([])
  const loadVSwitchError = ref('')
  const vSwitchLoading = ref(false)
  const vSwitch = ref('')

  const securityGroups = ref([])
  const loadSecurityGroupError = ref('')
  const securityGroupLoading = ref(false)

  const keyInvalid = ref(true)

  const errors = computed(() => {
    const errors = [loadRegionError, loadZoneError, loadVpcError, loadVSwitchError, loadSecurityGroupError]
      .filter((e) => e.value)
      .map(e => e.value)

      return [...new Set(errors)]
  })

  const loading = computed(() => {
    return [regionLoading, zoneLoading, imageLoading, vpcLoading, vSwitchLoading, securityGroupLoading]
      .map((state) => state.value)
      .some((state) => state === true)
  })

  const loadRegions = async () => {
    keyInvalid.value = true
    regionLoading.value = true
    const ecs = new ALY.ECS({
      accessKeyId: accessKeyId.value,
      secretAccessKey: accessKeySecret.value,
      endpoint: 'https://ecs.aliyuncs.com',
      apiVersion: '2014-05-26'
    })
    const promise = new Promise((resolve, reject) => {
      ecs.describeRegions({},
        (err, resp) => {
          regionLoading.value = false
          if (err) {
            loadRegionError.value = err?.message ?? err
            reject(err)
          } else {
            loadRegionError.value = ''
            regions.value = resp.Regions.Region
            // if (!region.value) {
            //   region.value = resp.Regions.Region[0]?.RegionId
            // }
            keyInvalid.value = false
            resolve(resp)
          }
      })
    })
    return promise
  }

  const loadZones = async () => {
    zoneLoading.value = true
    const ecs = new ALY.ECS({
      accessKeyId: accessKeyId.value,
      secretAccessKey: accessKeySecret.value,
      endpoint: 'https://ecs.aliyuncs.com',
      apiVersion: '2014-05-26'
    })
    const promise = new Promise((resolve, reject) => {
      ecs.describeZones({
        RegionId: region.value
      }, (err, resp) => {
        zoneLoading.value = false
        if (err) {
          loadZoneError.value = err?.message ?? err
          reject(err)
        } else {
          zones.value = resp.Zones.Zone
          // if (!zone.value) {
          //   zone.value = resp.Zones.Zone[0]?.ZoneId
          // }

          // const currentZone = resp.Zones.Zone.find((z) => z.ZoneId === zone.value)
          // if (currentZone) {
          //   instanceTypes.value = currentZone.AvailableInstanceTypes?.InstanceTypes ?? []
          // }

          resolve(resp)
        }
      })
    })
    return promise
  }

  const loadAllImages = (ecs, p) => {
    return new Promise((resolve, reject) => {
      ecs.describeImages(p, (err, resp) => {
        if (err) {
          reject(err)
        } else {
          resolve(resp)
        }
      })
    })
  }
  const loadImages = async () => {
    imageLoading.value = true
    const ecs = new ALY.ECS({
      accessKeyId: accessKeyId.value,
      secretAccessKey: accessKeySecret.value,
      endpoint: 'https://ecs.aliyuncs.com',
      apiVersion: '2014-05-26'
    })
    const pageSize = 50
    const promise = new Promise((resolve, reject) => {
      const p = {
        RegionId: region.value,
        InstanceType: instanceType.value,
        Status: 'Available',
        OSType: 'linux',
        IsSupportIoOptimized: true,
        ImageOwnerAlias: 'system',
        PageNumber: 1,
        PageSize: pageSize,
      }
      ecs.describeImages(Object.assign({}, p), async (err, resp) => {
        if (err) {
          loadImageError.value = err.message ?? err
          imageLoading.value = false
          reject(err)
          return
        }

        if (resp.TotalCount > 1) {
          const data = resp.Images.Image
          const totalPage = Math.ceil(resp.TotalCount / pageSize)
          const promises = []
          for (let i = 1; i < totalPage; i++) {
            const param = Object.assign({}, p, {
              PageNumber: i + 1,
              PageSize: pageSize,
            })
            promises.push(loadAllImages(ecs, param))
          }
          try {
            const resps = await Promise.all(promises)
            data.push(...resps.map((r) => r.Images.Image).flat())
            images.value = data
            resolve([resp, ...resps])
          } catch (err) {
            loadImageError.value = err.message ?? err
            reject(err)
          }
          imageLoading.value = false
          return
        }

        images.value = resp.Images.Image
        imageLoading.value = false
        resolve(resp)
        
      })
    })
    return promise
  }

  const loadAllVpcs = (ecs, p) => {
    return new Promise((resolve, reject) => {
      ecs.describeVpcs(p, (err, resp) => {
        if (err) {
          reject(err)
        } else {
          resolve(resp)
        }
      })
    })
  }
  const loadVpcs = () => {
    vpcLoading.value = true
    const ecs = new ALY.ECS({
      accessKeyId: accessKeyId.value,
      secretAccessKey: accessKeySecret.value,
      endpoint: 'https://ecs.aliyuncs.com',
      apiVersion: '2014-05-26'
    })
    const pageSize = 50
    return new Promise((resolve, reject) => {
      const p = {
        RegionId: region.value,
        PageNumber: 1,
        PageSize: pageSize,
      }
      ecs.describeVpcs(Object.assign({}, p), async (err, resp) => {
        if (err) {
          vpcLoading.value = false
          loadVpcError.value = err?.message ?? err
          reject(err)
          return
        }
        if (resp.TotalCount > 1) {
          const data = resp.Vpcs.Vpc
          const totalPage = Math.ceil(resp.TotalCount / pageSize)
          const promises = []
          for (let i = 1; i < totalPage; i++) {
            const param = Object.assign({}, p, {
              PageNumber: i + 1,
              PageSize: pageSize,
            })
            promises.push(loadAllVpcs(ecs, param))
          }
          try {
            const resps = await Promise.all(promises)
            data.push(...resps.map((r) => r.Vpcs.Vpc).flat())
            vpcs.value = data
            resolve([resp, ...resps])
          } catch (err) {
            loadVpcError.value = err.message ?? err
            reject(err)
          }
          vpcLoading.value = false
          return
        }
        vpcs.value = resp.Vpcs.Vpc
        vpcLoading.value = false
        resolve(resp)
      })
    })
  }

  const loadAllVSwitches = (ecs, p) => {
    return new Promise((resolve, reject) => {
      ecs.describeVSwitches(p, (err, resp) => {
        if (err) {
          reject(err)
        } else {
          resolve(resp)
        }
      })
    })
  }
  const loadVSwitches = () => {
    vSwitchLoading.value = true
    const ecs = new ALY.ECS({
      accessKeyId: accessKeyId.value,
      secretAccessKey: accessKeySecret.value,
      endpoint: 'https://ecs.aliyuncs.com',
      apiVersion: '2014-05-26'
    })
    const pageSize = 50
    return new Promise((resolve, reject) => {
      const p = {
        VpcId: vpc.value,
        ZoneId: zone.value,
        PageNumber: 1,
        PageSize: pageSize,
      }
      ecs.describeVSwitches(Object({}, p), async (err, resp) => {
        if (err) {
          vSwitchLoading.value = false
          loadVSwitchError.value = err?.message ?? err
          reject(err)
          return
        }
        if (resp.TotalCount > 1) {
          const data = resp.VSwitches.VSwitch
          const totalPage = Math.ceil(resp.TotalCount / pageSize)
          const promises = []
          for (let i = 1; i < totalPage; i++) {
            const param = Object.assign({}, p, {
              PageNumber: i + 1,
              PageSize: pageSize,
            })
            promises.push(loadAllVSwitches(ecs, param))
          }
          try {
            const resps = await Promise.all(promises)
            data.push(...resps.map((r) => r.VSwitches.VSwitch).flat())
            vSwitches.value = data
            resolve([resp, ...resps])
          } catch (err) {
            loadVSwitchError.value = err.message ?? err
            reject(err)
          }
          vSwitchLoading.value = false
          return
        }
        vSwitches.value = resp.VSwitches.VSwitch
        vSwitchLoading.value = false
        resolve(resp)
      })
    })
  }

  const loadVSwitch = (vSwitchId) => {
    return new Promise((resolve, reject) => {
      ecs.describeVSwitches({
        VpcId: vpc.value,
        ZoneId: zone.value,
        VSwitchId: vSwitchId,
        PageNumber: 1,
        PageSize: 50,
      }, (err, resp) => {
        if (err) {
          reject(err)
        } else {
          vpc.value = resp.VSwitches.VSwitch?.[0]?.VpcId
          resolve(resp)
        }
      })
    })
  }

  const loadAllSecurityGroups = (ecs, p) => {
    return new Promise((resolve, reject) => {
      ecs.describeSecurityGroups(p, (err, resp) => {
        if (err) {
          reject(err)
        } else {
          resolve(resp)
        }
      })
    })
  }
  const loadSecurityGroups = () => {
    const ecs = new ALY.ECS({
      accessKeyId: accessKeyId.value,
      secretAccessKey: accessKeySecret.value,
      endpoint: 'https://ecs.aliyuncs.com',
      apiVersion: '2014-05-26'
    })
    const pageSize = 50
    return new Promise((resolve, reject) => {
      const p = {
        RegionId: region.value,
        VpcId: vpc.value,
        PageNumber: 1,
        PageSize: pageSize,
      }
      ecs.describeSecurityGroups(Object.assign({}, p), async (err, resp) => {
        if (err) {
          securityGroupLoading.value = false
          loadSecurityGroupError.value = err?.message ?? err
          reject(err)
          return
        }
        if (resp.TotalCount > 1) {
          const data = resp.SecurityGroups.SecurityGroup
          const totalPage = Math.ceil(resp.TotalCount / pageSize)
          const promises = []
          for (let i = 1; i < totalPage; i++) {
            const param = Object.assign({}, p, {
              PageNumber: i + 1,
              PageSize: pageSize,
            })
            promises.push(loadAllSecurityGroups(ecs, param))
          }
          try {
            const resps = await Promise.all(promises)
            data.push(...resps.map((r) => r.SecurityGroups.SecurityGroup).flat())
            securityGroups.value = data
            resolve([resp, ...resps])
          } catch (err) {
            loadSecurityGroupError.value = err.message ?? err
            reject(err)
          }
          securityGroupLoading.value = false
          return
        }
        securityGroups.value = resp.SecurityGroups.SecurityGroup
        securityGroupLoading.value = false
        resolve(resp)
      })
    })
  }

  watch([zone, zones, keyInvalid], ([z, zs, keyInvalid]) => {
    if (!z || keyInvalid) {
      instanceTypes.value = []
      return
    }
    const currentZone = zs.find((item) => item.ZoneId === z)
    if (currentZone) {
      instanceTypes.value = currentZone.AvailableInstanceTypes?.InstanceTypes ?? []
      diskCategories.value = (currentZone.AvailableResources?.ResourcesInfo?.[0])?.SystemDiskCategories?.supportedSystemDiskCategory ?? []
      return
    }
    instanceTypes.value = []
    diskCategories.value = []
  }, {
    immediate: true
  })

  watch([region, keyInvalid], ([r, keyInvalid]) => {
    if (r && !keyInvalid) {
      loadVpcs()
      loadZones()
    } else {
      zones.value = []
    }
  }, {
    immediate: true
  })

  watch([region, vpc, keyInvalid], ([r, v, keyInvalid]) => {
    if (r && v && k && s && !keyInvalid) {
      loadSecurityGroups()
    }
  })

  watch([region, instanceType, keyInvalid], ([r, t, keyInvalid]) => {
    if (r && t && !keyInvalid) {
      loadImages()
    } else {
      images.value = []
    }
  }, {
    immediate: true
  })

  watch([vpc, zone, keyInvalid], ([v, z, keyInvalid]) => {
    if (v && z && !keyInvalid) {
      loadVSwitches()
    }
  }, {
    immediate: true
  })

  watch([vSwitch, keyInvalid], ([id, keyInvalid]) => {
    if (id && !keyInvalid) {
      loadVSwitch(id)
    }
  }, {
    immediate: true
  })

  return {
    accessKeyId,
    accessKeySecret,
    region,
    regions,
    zone,
    zones,
    vpc,
    vpcs,
    images,
    instanceTypes,
    instanceType,
    vSwitch,
    vSwitches,
    securityGroups,
    diskCategories,
    errors,
    loading,
    keyInvalid,
    loadRegions,
  }
}
