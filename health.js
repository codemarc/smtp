#!/usr/bin/env node
import { SMTPClient } from 'smtp-client'
import os from 'os'
import { resolve } from 'path'


(async function () {
  const sender = 'smtp@buildinglink.com'
  const now = new Date()
  const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
  const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)

  let relays = {
    "pdc": "smtprelay-pdc.buildinglink.local",
    "azure": "smtprelay-azure.buildinglink.local",
    "uat": "smtprelay-uat.buildinglink.local",
    "dev": "smtprelay-dev.buildinglink.local",
    "desk": "127.0.0.1" // container must use host network
  }

  let relay = relays[process.argv[2] ?? 'desk'] ?? relays['desk']

  let s = new SMTPClient({ host: relay, port: 25 })
  let rc = await s.connect()
  console.log(`connect(${relay})-> ${rc}`)
  if (rc != 220) throw "bad connect"

  let hostname = os.hostname()
  rc = await s.greet({ hostname: hostname })
  console.log(`greet(${hostname})-> ${rc}`)
  if (rc != 250) throw "bad greet"

  // basic health
  if (process.argv.length < 4) {
    rc = await s.quit()
    console.log(`quit()-> ${rc}`)
    if (rc != 221) throw "bad quit"
    resolve('Success')
    process.exit(0)

  } else {
    rc = await s.mail({ from: sender })
    console.log(`mail(${sender})-> ${rc}`)
    if (rc != 250) throw "bad sender"

    rc = await s.rcpt({ to: process.argv[3] })
    console.log(`rcpt(${process.argv[3]})-> ${rc}`)
    if (rc != 250) throw "bad receiver"

    rc = await s.data(`Subject: SMTP Test ${utcSecondsSinceEpoch}\r
    This is a test of the SMTP RELAY system.
    relay run thru ${relay}
    This is only a test`)
    console.log(`data(...)-> ${rc}`)
    if (rc != 250) throw "bad data"

    rc = await s.quit()
    console.log(`quit()-> ${rc}`)
    if (rc != 221) throw "bad quit"

    resolve('Success')
    process.exit(0)
  }

})().catch(err => {
  // console.error(err)
  resolve('Fail')
  process.exit(1)
})


