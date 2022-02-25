<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-20px">
    <ip-address-pool-form
      ref="masterIps"
      v-model="form.options['master-ips']"
      label="Master IPs"
      :desc="desc.options['master-ips']"
    ></ip-address-pool-form>
    <ip-address-pool-form
      ref="workerIps"
      v-model="form.options['worker-ips']"
      label="Worker IPs"
      :desc="desc.options['worker-ips']"
    ></ip-address-pool-form>
    <string-form
      v-model.trim="form.config['ssh-user']"
      label="SSH User"
      :desc="desc.config['ssh-user']"
    />
    <string-form
      v-model.trim="form.config['ssh-key-path']"
      label="SSH Key Path"
      :desc="desc.config['ssh-key-path']"
    />
  </div>
</template>
<script>
import {ref,defineComponent} from 'vue'
import StringForm from '@/views/components/baseForm/StringForm.vue'
import useFormFromSchema from '@/views/composables/useFormFromSchema.js'
import IpAddressPoolForm from '@/views/components/baseForm/IpAddressPoolForm.vue'
import { cloneDeep } from '@/utils'

export default defineComponent({
  props: {
    schema: {
      type: Object,
      required: true,
    },
    hasError: {
      type: Boolean,
      default: false,
    }
  },
  setup(props) {
    const { form, desc }= useFormFromSchema(props.schema)
    const masterIps = ref(null)
    const workerIps = ref(null)
   
    const getForm = () => {
      const f = cloneDeep(form)
      f.options['master-ips'] = masterIps.value.getForm().filter((v) => v).join(',')
      f.options['worker-ips'] = workerIps.value.getForm().filter((v) => v).join(',')
      return f
    }
    return {
      form,
      desc,
      masterIps,
      workerIps,
      getForm,
    }
  },
  components: {
    StringForm,
    IpAddressPoolForm,
  }
})
</script>