import { computed, reactive, ref, readonly } from 'vue'

export default function useAlibabaSdk() {
  const accessKeyId = ref('')
  const accessKeySecret = ref('')
  const region = ref('')
  const zone = ref('')
  const vpc = ref('')

  const keyInfo = reactive({
    loading: false,
    loaded: false,
    accessKeyId: '',
    secretAccessKey: '',
    error: null,
    valid: false
  })

  const regionInfo = reactive({
    loading: false,
    loaded: false,
    error: null,
    data: []
  })

  const zoneInfo = reactive({
    region: '',
    loading: false,
    loaded: false,
    error: null,
    data: []
  })
  const vpcInfo = reactive({
    region: '',
    loading: false,
    loaded: false,
    error: null,
    totalCount: 0,
    pageSize: 50,
    pageNumber: 0,
    data: []
  })
  const vSwitchInfo = reactive({
    zone: '',
    vpc: '',
    loading: false,
    loaded: false,
    error: null,
    totalCount: 0,
    pageSize: 50,
    pageNumber: 0,
    data: []
  })
  const securityGroupInfo = reactive({
    region: '',
    vpc: '',
    loading: false,
    loaded: false,
    error: null,
    totalCount: 0,
    pageSize: 50,
    pageNumber: 0,
    data: []
  })

  const vSwitchDetail = reactive({
    loading: false,
    loaded: false,
    data: null,
    error: null
  })

  const ecsOptions = computed(() => {
    return {
      accessKeyId: keyInfo.accessKeyId,
      secretAccessKey: keyInfo.secretAccessKey,
      endpoint: 'https://ecs.aliyuncs.com',
      apiVersion: '2014-05-26'
    }
  })

  const validateKeys = async (access, secret) => {
    keyInfo.accessKeyId = access ?? accessKeyId.value
    keyInfo.secretAccessKey = secret ?? accessKeySecret.value
    keyInfo.valid = false
    fetchRegions()
  }

  const fetchRegions = () => {
    keyInfo.loaded = false
    keyInfo.loading = true
    keyInfo.error = null
    keyInfo.valid = false
    regionInfo.loaded = false
    regionInfo.loading = true
    regionInfo.error = null
    regionInfo.data = []
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeRegions({}, (err, resp) => {
      keyInfo.loaded = true
      keyInfo.loading = false
      regionInfo.loaded = true
      regionInfo.loading = false
      if (err) {
        const msg = err.message ?? err
        keyInfo.error = msg
        regionInfo.error = msg
        return
      }
      keyInfo.valid = true
      regionInfo.data = resp.Regions.Region.map((r) => ({ label: r.RegionId, value: r.RegionId, raw: r }))
    })
  }

  const fetchZones = (r) => {
    const tmpRegion = r ?? region.value
    if (!tmpRegion) {
      zoneInfo.error = '"Region" is required'
      return false
    }
    zoneInfo.region = tmpRegion
    zoneInfo.loading = true
    zoneInfo.loaded = false
    zoneInfo.data = []
    zoneInfo.error = null
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeZones(
      {
        RegionId: zoneInfo.region
      },
      (err, resp) => {
        zoneInfo.loading = false
        zoneInfo.loaded = true
        if (err) {
          zoneInfo.error = err.message ?? err
          return
        }
        zoneInfo.data = resp.Zones.Zone.map((z) => ({ label: z.ZoneId, value: z.ZoneId, raw: z }))
      }
    )
  }

  const fetchVpcs = (r, pageNumber = 1) => {
    const tmpRegion = r ?? region.value
    if (pageNumber !== 1) {
      if (tmpRegion !== vpcInfo.region) {
        vpcInfo.error = 'Region has changed, no further VPC information is available'
        return false
      }
    }
    const totalCount = vpcInfo.totalCount
    const pageSize = vpcInfo.pageSize

    if (pageNumber !== 1) {
      if (pageSize === 0) {
        return
      }
      const totalPage = Math.ceil(totalCount / pageSize)

      if (pageNumber > totalPage) {
        return
      }
    }

    if (pageNumber !== vpcInfo.pageNumber) {
      vpcInfo.pageNumber = pageNumber
    }
    if (pageNumber === 1) {
      vpcInfo.data = []
    }
    vpcInfo.region = tmpRegion
    vpcInfo.loading = true
    vpcInfo.loaded = false
    vpcInfo.error = null

    const p = {
      RegionId: vpcInfo.region,
      PageNumber: pageNumber,
      PageSize: vpcInfo.pageSize
    }
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeVpcs(p, (err, resp) => {
      vpcInfo.loading = false
      vpcInfo.loaded = true
      if (err) {
        vpcInfo.error = err.message ?? err
        return
      }
      vpcInfo.totalCount = resp.TotalCount
      vpcInfo.pageNumber = pageNumber
      vpcInfo.data = [
        ...vpcInfo.data,
        ...resp.Vpcs.Vpc.map((v) => ({
          label: `${v.IsDefault ? '[Default]' : ''}${v.VpcName ? `${v.VpcName} / ${v.VpcId}` : v.VpcId}`,
          value: v.VpcId,
          raw: v
        }))
      ]
    })
  }

  const fetchVSwitches = (z, v, pageNumber = 1) => {
    const tmpZone = z ?? zone.value
    const tmpVpc = v ?? vpc.value
    if (pageNumber !== 1) {
      if (tmpZone !== vSwitchInfo.zone) {
        vSwitchInfo.error = 'Zone has changed, no further vSwitch information is available'
        return false
      }
      if (tmpVpc !== vSwitchInfo.vpc) {
        vSwitchInfo.error = 'VPC has changed, no further vSwitch information is available'
        return false
      }
    }
    const totalCount = vSwitchInfo.totalCount
    const pageSize = vSwitchInfo.pageSize

    if (pageNumber !== 1) {
      if (pageSize === 0) {
        return
      }
      const totalPage = Math.ceil(totalCount / pageSize)

      if (pageNumber > totalPage) {
        return
      }
    }

    if (pageNumber !== vSwitchInfo.pageNumber) {
      vSwitchInfo.pageNumber = pageNumber
    }
    if (pageNumber === 1) {
      vSwitchInfo.data = []
    }
    vSwitchInfo.zone = tmpZone
    vSwitchInfo.vpc = tmpVpc
    vSwitchInfo.loading = true
    vSwitchInfo.loaded = false
    vSwitchInfo.error = null

    const p = {
      ZoneId: vSwitchInfo.zone,
      VpcId: vSwitchInfo.vpc,
      PageNumber: pageNumber,
      PageSize: vSwitchInfo.pageSize
    }
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeVSwitches(p, (err, resp) => {
      vSwitchInfo.loading = false
      vSwitchInfo.loaded = true
      if (err) {
        console.log(err)
        vSwitchInfo.error = err.message ?? err
        return
      }
      vSwitchInfo.totalCount = resp.TotalCount
      vSwitchInfo.pageNumber = pageNumber
      vSwitchInfo.data = [
        ...vSwitchInfo.data,
        ...resp.VSwitches.VSwitch.map((s) => ({
          label: `${s.IsDefault ? '[Default]' : ''}${s.VSwitchName ? `${s.VSwitchName} / ` : ''}${s.VSwitchId}`,
          value: s.VSwitchId,
          raw: s
        }))
      ]
    })
  }

  const fetchVSwitchDetail = (id) => {
    vSwitchDetail.loading = true
    vSwitchDetail.loaded = false
    vSwitchDetail.error = null

    const p = {
      VSwitchId: id
    }
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeVSwitchAttributes(p, (err, resp) => {
      vSwitchDetail.loading = false
      vSwitchDetail.loaded = true
      if (err) {
        vSwitchDetail.error = err.message ?? err
        return
      }
      vSwitchDetail.data = resp.VSwitches.VSwitch[0]
    })
  }

  const fetchSecurityGroups = (r, v, pageNumber = 1) => {
    const tmpRegion = r ?? region.value
    const tmpVpc = v ?? vpc.value
    if (pageNumber !== 1) {
      if (tmpRegion !== securityGroupInfo.zone) {
        securityGroupInfo.error = 'Region has changed, no further security group information is available'
        return false
      }
      if (tmpVpc !== securityGroupInfo.vpc) {
        securityGroupInfo.error = 'VPC has changed, no further security group information is available'
        return false
      }
    }
    const totalCount = securityGroupInfo.totalCount
    const pageSize = securityGroupInfo.pageSize

    if (pageNumber !== 1) {
      if (pageSize === 0) {
        return
      }
      const totalPage = Math.ceil(totalCount / pageSize)

      if (pageNumber > totalPage) {
        return
      }
    }

    if (pageNumber !== securityGroupInfo.pageNumber) {
      securityGroupInfo.pageNumber = pageNumber
    }
    if (pageNumber === 1) {
      securityGroupInfo.data = []
    }
    securityGroupInfo.region = tmpRegion
    securityGroupInfo.vpc = tmpVpc
    securityGroupInfo.loading = true
    securityGroupInfo.loaded = false
    securityGroupInfo.error = null

    const p = {
      RegionId: securityGroupInfo.region,
      VpcId: securityGroupInfo.vpc,
      PageNumber: pageNumber,
      PageSize: securityGroupInfo.pageSize
    }
    // eslint-disable-next-line no-undef
    const ecs = new ALY.ECS(ecsOptions.value)
    ecs.describeSecurityGroups(p, (err, resp) => {
      securityGroupInfo.loading = false
      securityGroupInfo.loaded = true
      if (err) {
        securityGroupInfo.error = err.message ?? err
        return
      }
      securityGroupInfo.totalCount = resp.TotalCount
      securityGroupInfo.pageNumber = pageNumber
      securityGroupInfo.data = [
        ...securityGroupInfo.data,
        ...resp.SecurityGroups.SecurityGroup.map((sg) => ({
          label: `${sg.SecurityGroupName ? `${sg.SecurityGroupName} / ` : ''}${sg.SecurityGroupId}`,
          value: sg.SecurityGroupId,
          raw: sg
        }))
      ]
    })
  }

  const resetZoneInfo = () => {
    zoneInfo.data = []
    zoneInfo.loaded = false
    zoneInfo.loading = false
    zoneInfo.error = null
    zoneInfo.region = ''
  }
  // const resetRegionInfo = () => {
  //   regionInfo.data = []
  //   regionInfo.loaded = false
  //   regionInfo.loading = false
  //   regionInfo.error = null
  // }
  const resetVpcInfo = () => {
    vpcInfo.data = []
    vpcInfo.loaded = false
    vpcInfo.loading = false
    vpcInfo.error = null
    vpcInfo.region = ''
    vpcInfo.totalCount = 0
    vpcInfo.pageSize = 50
    vpcInfo.pageNumber = 0
  }
  const resetVSwitchInfo = () => {
    vSwitchInfo.data = []
    vSwitchInfo.loaded = false
    vSwitchInfo.loading = false
    vSwitchInfo.error = null
    vSwitchInfo.zone = ''
    vSwitchInfo.vpc = ''
    vSwitchInfo.totalCount = 0
    vSwitchInfo.pageSize = 50
    vSwitchInfo.pageNumber = 0
  }

  const resetSecurityGroupInfo = () => {
    securityGroupInfo.data = []
    securityGroupInfo.loaded = false
    securityGroupInfo.loading = false
    securityGroupInfo.error = null
    securityGroupInfo.region = ''
    securityGroupInfo.vpc = ''
    securityGroupInfo.totalCount = 0
    securityGroupInfo.pageSize = 50
    securityGroupInfo.pageNumber = 0
  }

  const resetAll = () => {
    // keyInfo.loaded = false
    // keyInfo.loading = false
    // keyInfo.valid = false
    // keyInfo.error = null
    resetZoneInfo()
    resetVpcInfo()
    resetVSwitchInfo()
    resetSecurityGroupInfo()
  }

  return {
    keyInfo: readonly(keyInfo),
    regionInfo: readonly(regionInfo),
    zoneInfo: readonly(zoneInfo),
    vSwitchInfo: readonly(vSwitchInfo),
    vpcInfo: readonly(vpcInfo),
    securityGroupInfo: readonly(securityGroupInfo),
    vSwitchDetail: readonly(vSwitchDetail),
    resetZoneInfo,
    resetVpcInfo,
    resetVSwitchInfo,
    resetSecurityGroupInfo,
    resetAll,
    validateKeys,
    fetchZones,
    fetchVpcs,
    fetchVSwitches,
    fetchSecurityGroups,
    fetchVSwitchDetail
  }
}