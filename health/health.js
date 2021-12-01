#!/usr/bin/env node
require("dotenv").config()
const pak = require('./package.json')
const os = require('os')
const { exit, argv } = require('process')
const {SMTPClient} = require('smtp-client')
const {format} = require('date-fns')
const {resolve} = require('path')
const signon = `\n${pak.name} v${pak.version}\nCopyright (c) 2021 BuildingLink.com\nAll Rights Reserved.\n`
const now = new Date()
const timestamp = format(now, 'yyyy-MM-dd HH:mm:ss')

const utcMilllisecondsSinceEpoch = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000)

const showVersion = (argv.includes('-v') || argv.includes('--version'))
const showHelp = (argv.includes('-h') || argv.includes('-?') || argv.includes('--help'))
const checkReadiness = (argv.includes('-r') || argv.includes('--ready'))
const checkLiveness = (argv.includes('-l') || argv.includes('--live'))

const relay = (argv.includes('-pdc') || argv.includes('--pdc')) 
  ? "smtprelay-pdc.buildinglink.local" :  process.env.DSMTP_RELAY ?? "127.0.0.1"

const port = process.env.DSMTP_PORT ?? 25
const hostname = process.env.DSMTP_HOSTNAME ?? os.hostname()
const sender = process.env.DSMTP_FROM ?? 'smtp@buildinglink.com'

let recpt = null
if (argv.includes('-t')) {
  let ndx = argv.indexOf('-t')
  recpt = argv[ndx + 1]

} else if (argv.includes('--to')) {
  let ndx = argv.indexOf('--to')
  recpt = argv[ndx + 1]
}

const to = recpt ?? process.env.DSMTP_TO

const subject = 'Subject: '+ (process.env.DSMTP_SUBJECT ?? `SMTP Test ${utcSecondsSinceEpoch}`)

const email=`From: ${sender}
To: ${to}
Subject: ${subject}

SMTP relay running thru ${relay} from ${hostname}. This is only a test.
`

const health = (tag,msg) => {
  let rc={
    Name:"smtp",
    Category: tag,
    Tags: relay,
    Cid: utcMilllisecondsSinceEpoch,
    Host: hostname,
    message: `${timestamp}|${msg}`
  }
  return JSON.stringify(rc);
}

///////////////////////////////////////////////////////////////////////////////
// main
const main = async () => {
  try {
  
    // display the signon message
    if (showVersion) {
      console.log(`v${pak.version}`)
      exit(0)
    } else if(showHelp) {
      console.log(signon)
      console.log(`health [options]

where:     
     -h, --help       display help and exit
     -l, --live       run Liveness Check
     -pdc, --pdc      use the pdc relay
     -r, --ready      run Readiness Check
     -t , --to        recipient(s)
     -v, --version    display version and exit\n\n`)
      exit(0)
      }

      let s = new SMTPClient({ host: relay, port: port })
      let rc = await s.connect()

      let o = `connect(${relay}:${rc})`
      if (rc != 220) throw "bad connect"

      rc = await s.greet({ hostname: hostname })
      o += `->greet(${hostname}:${rc})`
      if (rc != 250) throw "bad greet"

      if (checkReadiness || !checkLiveness) {
        rc = await s.quit()
        o += `->quit(${rc})`
        if (rc != 221) throw "bad quit"

        resolve('Success')
        console.log(health('info',o))
        exit(0)
      }

      rc = await s.mail({ from: sender })
      o += `->mail(${rc})`
      if (rc != 250) throw "bad sender"

      rc = await s.rcpt({ to: to })
      o += `->rcpt(${to}:${rc})`
      if (rc != 250) throw "bad receiver"

      rc = await s.data(email)
      o += `->data(${rc})`
      if (rc != 250) throw "bad data"

      rc = await s.quit()
      o += `->quit(${rc})`
      if (rc != 221) throw "bad quit"
      resolve('Success')

      console.log(health('info',o))
      exit(0)
    } catch(err) {
      console.log(health('error',err))
      exit(1)
    }
}
main()

