#!/usr/bin/env node
import { SMTPClient } from 'smtp-client'
import { format } from 'date-fns'
import os from 'os'
import { resolve } from 'path'
import { exit } from 'process'
import { Console } from 'console'

(async function () {
  const hostname = os.hostname()
  const sender = 'smtp@buildinglink.com'
  const now = new Date()
  const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
  const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)
  const timestamp = format(now, 'yyyy-MM-dd HH:mm:ss')
  const health = (msg) => `${timestamp}|smtp|info|health|${utcMilllisecondsSinceEpoch}|${hostname}|${msg ?? ''}`

  let relays = {
    "localhost": "127.0.0.1", // container must use host network
    "pdc": "smtprelay-pdc.buildinglink.local"
  }

  if (process.argv[2] == 'help' || process.argv[2] == '--help') {
    console.log('health [[relay] email] WHERE:')
    console.log(relays)
    process.exit(0)
  }

  let omsg = ''
  let relay = relays[process.argv[2] ?? 'localhost'] ?? relays['localhost']
  let s = new SMTPClient({ host: relay, port: 25 })
  let rc = await s.connect()
  omsg = `connect(${relay}:${rc})`
  if (rc != 220) throw "bad connect"

  rc = await s.greet({ hostname: hostname })
  omsg += `->greet(${hostname}:${rc})`
  if (rc != 250) throw "bad greet"

  // basic health
  if (process.argv.length < 4) {
    rc = await s.quit()
    omsg += `->quit(${rc})`

    if (rc != 221) throw "bad quit"
    resolve('Success')
    console.log(health(omsg))
    process.exit(0)

  } else {
    rc = await s.mail({ from: sender })
    omsg += `->mail(${rc})`
    if (rc != 250) throw "bad sender"

    rc = await s.rcpt({ to: process.argv[3] })
    omsg += `->rcpt(${process.argv[3]}:${rc})`
    if (rc != 250) throw "bad receiver"

    rc = await s.data(`Subject: SMTP Test ${utcSecondsSinceEpoch}\nSMTP relay running thru ${relay}.\nThis is only a test.`)
    omsg += `->data(${rc})`
    if (rc != 250) throw "bad data"

    rc = await s.quit()
    omsg += `->quit(${rc})`
    if (rc != 221) throw "bad quit"
    resolve('Success')

    console.log(health(omsg))
    process.exit(0)
  }

})().catch(err => {
  const hostname = os.hostname()
  const now = new Date()
  const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
  const timestamp = format(now, 'yyyy-MM-dd HH:mm:ss')
  const health = (msg) => `${timestamp}|smtp|error|health|${utcMilllisecondsSinceEpoch}|${hostname}|${msg ?? ''}`
  resolve('Fail')
  console.log(health(err.code))
  process.exit(1)
})


