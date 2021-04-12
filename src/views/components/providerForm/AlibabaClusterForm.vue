<template>
  <!-- fake fields are a workaround for chrome autofill getting the wrong fields -->
  <input style="display: none" autocomplete="new-password" type="password" />
  <div class="alibaba-cluster-create-form__credencial">
    <password-form
      v-model="form.options['access-key']"
      label="Access Key"
      :desc="desc.options['access-key']"
      :readonly="readonly">
    </password-form>
    <password-form
      v-model="form.options['access-secret']"
      label="Access Secret"
      :desc="desc.options['access-secret']"
      :readonly="readonly">
    </password-form>
  </div>
  <k-alert v-for="(e, index) in errors" :key="index" type="error" :title="e" v-show="keyInvalid"></k-alert>
  <footer-actions v-show="keyInvalid">
    <k-button class="bg-primary" type="button" :disabled="loading" @click="validateKeys">Next: Authenticate & Configure Instance</k-button>
  </footer-actions>
  <tabs tab-position="left" v-model="acitiveTab" v-show="!keyInvalid">
    <tab-pane label="Instance Options" name="instance">
      <form-group>
        <template #title>Basic</template>
        <template #default>
          <div class="alibaba-cluster-create-form__content">
            <k-select
              :loading="loading"
              v-model="form.options.region"
              label="Region"
              :desc="desc.options.region"
              :disabled="readonly">
              <k-option v-for="r in regionOptions" :key="r.value" :value="r.value" :label="r.label"></k-option>
            </k-select>
            <!-- <string-form
              v-model.trim="form.options.zone"
              label="Zone"
              :desc="desc.options.zone"
              :readonly="readonly"
            /> -->
            <k-select
              :loading="loading"
              v-model="form.options.zone"
              label="Zone"
              :desc="desc.options.zone"
              :disabled="readonly">
              <k-option v-for="z in zoneOptions" :key="z.value" :value="z.value" :label="z.label"></k-option>
            </k-select>
            <!-- <string-form
              v-model.trim="form.options['instance-type']"
              label="Instance Type"
              :desc="desc.options['instance-type']"
              :readonly="readonly"
            /> -->
            <combo-box
              :loading="loading"
              v-model="form.options['instance-type']"
              label="Instance Type"
              :desc="desc.options['instance-type']"
              :disabled="readonly"
              :options="instanceTypeOptions.map((t) => t.value).sort()"
              :filterable="true"
              :editable="false">
            </combo-box>
            <!-- <string-form
              v-model.trim="form.options['image']"
              label="Image"
              :desc="desc.options['image']"
              :readonly="readonly"
            /> -->
            <combo-box
              :loading="loading"
              v-model="form.options['image']"
              label="Instance Type"
              :desc="desc.options['image']"
              :disabled="readonly"
              :options="imageOptions.map((t) => t.value).sort()"
              :filterable="true"
              :editable="false">
            </combo-box>
            <!-- <string-form
              v-model.trim="form.options['disk-category']"
              label="Disk Category"
              :desc="desc.options['disk-category']"
              :readonly="readonly"
            /> -->
            <k-select
              :loading="loading"
              v-model="form.options['disk-category']"
              label="Disk Category"
              :desc="desc.options['disk-category']"
              :disabled="readonly">
              <k-option v-for="dc in diskCategoryOptions" :key="dc.value" :value="dc.value" :label="dc.label"></k-option>
            </k-select>
            <string-form
              v-model.trim="form.options['disk-size']"
              label="Disk Size"
              :desc="desc.options['disk-size']"
              :readonly="readonly"
            />
          </div>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group :closable="true">
        <template #title>Network</template>
        <template #default>
          <div class="alibaba-cluster-create-form__content">
            <k-select
              :loading="loading"
              v-model="vpc"
              label="VPC"
              :disabled="readonly">
              <k-option v-for="v in vpcOptions" :key="v.value" :value="v.value" :label="v.label"></k-option>
            </k-select>
            <!-- <string-form
              v-model.trim="form.options['v-switch']"
              label="V-Switch"
              :desc="desc.options['v-switch']"
              :readonly="readonly"
            /> -->
            <k-select
              :loading="loading"
              v-model="form.options['v-switch']"
              label="V-Switch"
              :desc="desc.options['v-switch']"
              :disabled="readonly">
              <k-option v-for="s in vSwitchOptions" :key="s.value" :value="s.value" :label="s.label"></k-option>
            </k-select>
            <string-form
              v-model.trim="form.options['internet-max-bandwidth-out']"
              label="Internet Max Bandwidth Out"
              :desc="desc.options['internet-max-bandwidth-out']"
            />
            <!-- <string-form
              v-model.trim="form.options['security-group']"
              label="Security Group"
              :desc="desc.options['security-group']"
              :readonly="readonly"
            /> -->
            <k-select
              :loading="loading"
              v-model="form.options['security-group']"
              label="Security Group"
              :desc="desc.options['security-group']"
              :disabled="readonly">
              <k-option v-for="sg in securityGroupOptions" :key="sg.value" :value="sg.value" :label="sg.label"></k-option>
            </k-select>
            <boolean-form
              v-model="form.options['eip']"
              label="EIP"
              :desc="desc.options['eip']"
              :readonly="readonly"
            />
          </div>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group>
        <template #title>SSH Public</template>
        <template #subtitle>
          Params used to login to instance via ssh, e.g. key-pair, ssh user, ssh port
        </template>
        <template #default>
          <div class="alibaba-cluster-create-form__content">
            <string-form
              v-model.trim="form.options['key-pair']"
              label="Key Pair"
              :desc="desc.options['key-pair']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.config['ssh-user']"
              label="SSH User"
              :desc="desc.config['ssh-user']"
              :readonly="readonly"
            />
            <string-form
              v-model.trim="form.config['ssh-port']"
              label="SSH Port"
              :desc="desc.config['ssh-port']"
              :readonly="readonly"
            />
          </div>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group>
        <template #title>SSH Private</template>
        <template #subtitle>
          Params used to login to instance from user computer, e.g. ssh private key, ssh password, etc
        </template>
        <template #default>
          <ssh-private-form :form="form" :desc="desc" :readonly="readonly"></ssh-private-form>
        </template>
      </form-group>
      <hr class="section-divider">
      <form-group :closable="true">
        <template #title>Advance</template>
        <template #default>
          <cluster-tags-form
            v-model="form.options.tags"
            :desc="desc.options['tags']"
            :readonly="readonly"></cluster-tags-form>
        </template>
      </form-group>
    </tab-pane>
    <tab-pane label="K3s Options" name="k3s">
      <k3s-options-form
        :visible="acitiveTab === 'k3s'"
        :form="form"
        :desc="desc">
      </k3s-options-form>
    </tab-pane>
    <tab-pane label="Additional Options" name="additional">
      <div class="alibaba-cluster-create-form__content">
        <boolean-form
          v-model="form.config['ui']"
          label="UI"
          :desc="desc.config['ui']"
          :readonly="readonly"
        />
        <boolean-form
          v-model="form.options['cloud-controller-manager']"
          label="Cloud Controller Manager"
          :desc="desc.options['cloud-controller-manager']"
          :readonly="readonly"
        />
        <boolean-form
          v-model="form.config['terway']"
          label="Terway"
          :desc="desc.config['terway']"
          true-value="eni"
          false-value="none"
          :readonly="readonly"
        />
        <string-form
          v-show="form.config['terway'] === 'eni'"
          label="Terway Max Pool Size"
          type="number"
          v-model="form.config['terway-max-pool-size']"
          :readonly="readonly">
        </string-form>
      </div>
    </tab-pane>
  </tabs>
  <div v-show="!keyInvalid">
    <slot></slot>
  </div>
</template>
<script>
import { cloneDeep } from '@/utils'
import {computed, defineComponent, ref, watchEffect, watch} from 'vue'
import {Select as KSelect, Option as KOption, OptionGroup as kOptionGroup} from '@/components/Select'
import {Tabs, TabPane} from '@/components/Tabs'
import BooleanForm from '../baseForm/BooleanForm.vue'
import StringForm from '../baseForm/StringForm.vue'
import K3sOptionsForm from '../baseForm/K3sOptionsForm.vue'
import SshPrivateForm from '../baseForm/SshPrivateForm.vue'
import ClusterTagsForm from '../baseForm/ClusterTagsForm.vue'
import FormGroup from '../baseForm/FormGroup.vue'
import KAlert from '@/components/Alert'
import ComboBox from '@/components/ComboBox'
import FooterActions from '@/views/components/FooterActions.vue'
import KButton from '@/components/Button'
import { PasswordInput as PasswordForm} from '@/components/Input'
import { Collapse, CollapseItem } from '@/components/Collapse'
import useAlibabaSdk from '../../composables/useAlibabaSdk.js'

import useFormFromSchema from '../../composables/useFormFromSchema.js'
export default defineComponent({
  props: {
    schema: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    loadingState: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:loadingState'],
  setup(props, {emit}) {
    const { form, desc }= useFormFromSchema(props.schema)
    const acitiveTab = ref('instance')

    const getForm = () => {
      return cloneDeep(form)
    }
    // aliyun sdk
    const {loading, keyInvalid, accessKeyId, accessKeySecret, diskCategories, instanceTypes, instanceType, region, regions, images, zone, zones, vpcs, vpc, vSwitch, vSwitches, securityGroups, errors, loadRegions} = useAlibabaSdk()

    const regionOptions = computed(() => {
      const r = form.options.region
      if (r && regions.value.length === 0) {
        return [{
          label: r,
          value : r,
        }]
      }
      return regions.value.map((r) => ({
        label: r.RegionId,
        value: r.RegionId,
      }))
    })

    const imageOptions = computed(() => {
      const m = form.options['image']
      if (m && images.value.length === 0) {
        return [{
          label: m,
          value : m,
        }]
      }
      return images.value.map((m) => ({
        label: m.ImageId,
        value: m.ImageId,
      }))
    })

    const zoneOptions = computed(() => {
      const z = form.options.zone
      if (zone && zones.value.length === 0) {
        return [{
          label: z,
          value: z,
        }]
      }
      return zones.value.map((z) => ({
        label: z.ZoneId,
        value: z.ZoneId,
      }))
    })

    const instanceTypeOptions = computed(() => {
      const t = form.options['instance-type']
      if (t && instanceTypes.value.length === 0) {
        return [
          {
            label: t,
            value: t,
          }
        ]
      }
      return instanceTypes.value.map((t) => ({
        label: t,
        value: t,
      }))
    })

    const vpcOptions = computed(() => {
      if (vpcs.value.length > 0 && !vpcs.value.find((v) => v.VpcId === vpc.value)) {
        return [{
          label: vpc.value,
          value: vpc.value,
        }]
      }
      return vpcs.value.map((v) => ({
        label: v.VpcId,
        value: v.VpcId,
      }))
    })

    const vSwitchOptions = computed(() => {
      const vs = form.options['v-switch']
      if (vs && vSwitches.value.length === 0) {
        return [{
          label: vs,
          value: vs,
        }]
      }
      return vSwitches.value.map((s) => ({
        label: s.VSwitchId,
        value: s.VSwitchId,
      }))
    })

    const securityGroupOptions = computed(() => {
      const sg = form.options['security-group']
      if (sg && securityGroups.value.length === 0) {
        return [{
          label: sg,
          value: sg,
        }]
      }
      return securityGroups.value.map((sg) => ({
        label: sg.SecuryGroupId,
        value: sg.SecuryGroupId,
      }))
    })

    const diskCategoryOptions = computed(() => {
      const dc = form.options['disk-category']
      if (dc && diskCategories.value.length === 0) {
        return [{
          label: dc,
          value: dc,
        }]
      }
      return diskCategories.value.map((dc) => ({
        label: dc,
        value: dc,
      }))
    })

    watch([() => form.options['access-key'], () => form.options['access-secret']], ([k, s]) => {
      accessKeyId.value = k
      accessKeySecret.value = s
      if (keyInvalid.value === false) {
        keyInvalid.value = true
      }
    }, {
      immediate: true
    })
    watch(() => form.options.region, (r) => {
      region.value = r
      if (keyInvalid.value === false) {
        loadRegions()
      }
    }, {
      immediate: true
    })
    watch(() => form.options.zone, (z) => {
      zone.value = z
    }, {
      immediate: true
    })
    watch(() => form.options['v-switch'],() => {
      vSwitch.value = form.options['v-switch']
    }, {
      immediate: true
    })
    watch(() => form.options['instance-type'], (t) => {
      instanceType.value = t
    }, {
      immediate: true
    })
    watch(regionOptions, (options) => {
      const currentRegion = form.options.region
      if (options.length > 0 && !options.find((r) => r.value === currentRegion)) {
        form.options.region = options[0].value
      }
    })
    watch(zoneOptions, (zones) => {
      const currentZone = form.options.zone
      if (zones.length > 0 && !zones.find((z) => z.value === currentZone)) {
        form.options.zone = zones[0].value
      }
    }, {
      immediate: true
    })

    watch(instanceTypeOptions, (types) => {
      const currentType = form.options['instance-type']
      if (types.length > 0 && !types.find((t) => t.value === currentType)) {
        form.options['instance-type'] =types[0].value 
      }
    }, {
      immediate: true
    })

    watch(vpcOptions, (vpcs) => {
      const currentVpc = vpc.value
      if (vpcs.length > 0 && !vpcs.find((v) => v.value === currentVpc)) {
        vpc.value = ''
      }
    }, {
      immediate: true
    })

    watch(vSwitchOptions, (vSwitches) => {
      const currentVSwitch = form.options['v-switch']
      if (vSwitches.length > 0 && !vSwitches.find((s) => s.value === currentVSwitch)) {
        form.options['v-switch'] = ''
      }
    }, {
      immediate: true
    })

    watch(securityGroupOptions, (sgs) => {
      const currentSg = form.options['security-group']
      if (sgs.length > 0 && !sgs.find((s) => s.value === currentSg)) {
        form.options['security-group'] = ''
      }
    }, {
      immediate: true
    })

    watchEffect(() => {
      emit('update:loadingState', loading.value)
    })

    const validateKeys = loadRegions

    return {
      form,
      desc,
      acitiveTab,
      getForm,
      regionOptions,
      zoneOptions,
      imageOptions,
      instanceTypeOptions,
      vpcOptions,
      vSwitchOptions,
      securityGroupOptions,
      errors,
      loading,
      keyInvalid,
      validateKeys,
      diskCategoryOptions,
      vpc,
      vpcOptions,
    }
  },
  components: {
    Tabs,
    TabPane,
    BooleanForm,
    StringForm,
    PasswordForm,
    TabPane,
    Collapse,
    CollapseItem,
    K3sOptionsForm,
    SshPrivateForm,
    ClusterTagsForm,
    FormGroup,
    KSelect,
    KOption,
    kOptionGroup,
    FooterActions,
    KAlert,
    KButton,
    ComboBox,
  }
})
</script>
<style>
.alibaba-cluster-create-form__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
  column-gap: 10px;
}
.alibaba-cluster-create-form__credencial {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 10px;
  column-gap: 10px;
  padding-bottom: 20px;
}
</style>