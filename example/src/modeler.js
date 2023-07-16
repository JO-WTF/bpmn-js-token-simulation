/* global process */

import TokenSimulationModule from '../..';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import AddExporter from '@bpmn-io/add-exporter';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  CamundaPlatformPropertiesProviderModule,
} from "bpmn-js-properties-panel";

import fileDrop from 'file-drops';

import fileOpen from 'file-open';

import download from 'downloadjs';

import exampleXML from '../resources/example.bpmn';

import SimulationSupportModule from "../../lib/simulation-support";

import xmlFormat from "xml-formatter";
import Notify from "simple-notify";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
hljs.registerLanguage("xml", xml);

const url = new URL(window.location.href);

const persistent = url.searchParams.has('p');
const active = url.searchParams.has('e');
const presentationMode = url.searchParams.has('pm');

let fileName = 'diagram.bpmn';

const initialDiagram = (() => {
  try {
    return persistent && localStorage['diagram-xml'] || exampleXML;
  } catch (err) {
    return exampleXML;
  }
})();

function showMessage(cls, message) {
  const messageEl = document.querySelector('.drop-message');

  messageEl.textContent = message;
  messageEl.className = `drop-message ${cls || ''}`;

  messageEl.style.display = 'block';
}

function hideMessage() {
  const messageEl = document.querySelector('.drop-message');

  messageEl.style.display = 'none';
}

if (persistent) {
  hideMessage();
}

const ExampleModule = {
  __init__: [
    [ 'eventBus', 'bpmnjs', 'toggleMode', function(eventBus, bpmnjs, toggleMode) {

      if (persistent) {
        eventBus.on('commandStack.changed', function() {
          bpmnjs.saveXML().then(result => {
            localStorage['diagram-xml'] = result.xml;
          });
        });
      }

      if ('history' in window) {
        eventBus.on('tokenSimulation.toggleMode', event => {

          document.body.classList.toggle('token-simulation-active', event.active);

          if (event.active) {
            url.searchParams.set('e', '1');
          } else {
            url.searchParams.delete('e');
          }

          history.replaceState({}, document.title, url.toString());
        });
      }

      eventBus.on('diagram.init', 500, () => {
        toggleMode.toggleMode(active);
      });
    } ]
  ]
};

const modeler = new BpmnModeler({
  container: '#canvas',
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    CamundaPlatformPropertiesProviderModule,
    TokenSimulationModule,
    SimulationSupportModule,
    AddExporter,
    ExampleModule
  ],
  propertiesPanel: {
    parent: '#properties-panel'
  },
  exporter: {
    name: 'bpmn-js-token-simulation',
    version: process.env.TOKEN_SIMULATION_VERSION
  },
  keyboard: {
    bindTo: document
  }
});


async function openDiagram(diagram) {
  return await modeler
    .importXML(diagram)
    .then(({ warnings }) => {
      if (warnings.length) {
        console.warn(warnings);
      }

      if (persistent) {
        localStorage['diagram-xml'] = diagram;
      }

      modeler.get('canvas').zoom('fit-viewport');
    })
    .catch(err => {
      console.error(err);
    });
}

if (presentationMode) {
  document.body.classList.add('presentation-mode');
}

async function openFile(files) {
  // files = [ { name, contents }, ... ]

  if (!files.length) {
    return;
  }

  hideMessage();

  fileName = files[0].name;

  await openDiagram(files[0].contents);
}

document.body.addEventListener('dragover', fileDrop('Open BPMN diagram', openFile), false);

function downloadDiagram() {
  modeler.saveXML({ format: true }, function(err, xml) {
    if (!err) {
      download(xml, fileName, 'application/xml');
    }
  });
}

document.body.addEventListener('keydown', function(event) {
  if (event.code === 'KeyS' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();

    downloadDiagram();
  }

  if (event.code === 'KeyO' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();

    fileOpen().then(openFile);
  }
});


function fitView() {
  modeler.get("canvas").zoom("fit-viewport");
}

document.querySelector("#fit-view").addEventListener("click", function (event) {
  fitView();
});

function showDiagram() {
  modeler.saveXML({ format: true }, function (err, xml) {
    if (!err) {
      document.querySelector(".modal-body #diagram-text").value =
        xmlFormat(xml);
      // hljs.highlightElement(document.querySelector('.modal-body #diagram-text'));
    }
  });
}

function copyToClipboard() {
  /* Get the text field */
  let textArea = document.getElementById("diagram-text");

  /* Select the text field */
  textArea.select();

  /* Copy the text inside the text field */
  navigator.clipboard.writeText(textArea.value);

  console.log(textArea.value);
}

document
  .querySelector("#show-diagram-button")
  .addEventListener("click", function (event) {
    showDiagram();
  });

document
  .querySelector("#copy-diagram-button")
  .addEventListener("click", function (event) {
    copyToClipboard();
    new Notify({
      status: "success",
      title: "Notify Title",
      text: "Notify text lorem ipsum111",
      effect: "fade",
      speed: 300,
      customClass: "",
      customIcon: "",
      showIcon: true,
      showCloseButton: false,
      autoclose: true,
      autotimeout: 2000,
      gap: 20,
      distance: 20,
      type: 1,
      position: "right bottom",
    });
  });

document
  .querySelector("#download-diagram-button")
  .addEventListener("click", function (event) {
    downloadDiagram();
  });


const propertiesPanel = document.querySelector('#properties-panel');

const propertiesPanelResizer = document.querySelector('#properties-panel-resizer');

let startX, startWidth;

function toggleProperties(open) {

  if (open) {
    url.searchParams.set('pp', '1');
  } else {
    url.searchParams.delete('pp');
  }

  history.replaceState({}, document.title, url.toString());

  propertiesPanel.classList.toggle('open', open);
}

propertiesPanelResizer.addEventListener('click', function(event) {
  toggleProperties(!propertiesPanel.classList.contains('open'));
});

propertiesPanelResizer.addEventListener('dragstart', function(event) {
  const img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  event.dataTransfer.setDragImage(img, 1, 1);

  startX = event.screenX;
  startWidth = propertiesPanel.getBoundingClientRect().width;
});

propertiesPanelResizer.addEventListener('drag', function(event) {

  if (!event.screenX) {
    return;
  }

  const delta = event.screenX - startX;

  const width = startWidth - delta;

  const open = width > 200;

  propertiesPanel.style.width = open ? `${width}px` : null;

  toggleProperties(open);
});

const remoteDiagram = url.searchParams.get('diagram');

if (remoteDiagram) {
  fetch(remoteDiagram).then(
    r => {
      if (r.ok) {
        return r.text();
      }

      throw new Error(`Status ${r.status}`);
    }
  ).then(
    text => openDiagram(text)
  ).catch(
    err => {
      showMessage('error', `Failed to open remote diagram: ${err.message}`);

      openDiagram(initialDiagram);
    }
  );
} else {
  await openDiagram(initialDiagram);
}

// open property panel if url contains "pp"
toggleProperties(url.searchParams.has('pp'));

// add clock to canvas
function addClock(date) {
  const node = document.createElement("div");
  node.innerHTML =
    '<div title="Clock" id="clockDisplay" class="bts-animation-speed-button " style="width: 150px;"><span class="bts-icon " style="width:150px;">01/01 00:00:00</span></div>';
  document.querySelector(".bts-set-animation-speed").appendChild(node);
}
function setTime(date) {
  setTimeout(date.setSeconds(date.getSeconds() + 1111), 1000);
  showTime(date);
}
function showTime(date) {
  console.log(date.getMonth());
  var mm = date.getMonth() + 1;
  var dd = date.getDate();
  var h = date.getHours(); // 0 - 23
  var m = date.getMinutes(); // 0 - 59
  var s = date.getSeconds(); // 0 - 59
  mm = mm < 10 ? "0" + mm : mm;
  dd = dd < 10 ? "0" + dd : dd;
  h = h < 10 ? "0" + h : h;
  m = m < 10 ? "0" + m : m;
  s = s < 10 ? "0" + s : s;
  var time = mm + "/" + dd + " " + h + ":" + m + ":" + s;
  console.log(time);
  document.querySelector("#clockDisplay>span").innerText = time;
}

addClock();

const elementRegistry = modeler.get("elementRegistry");
const simulationSupport = modeler.get("simulationSupport");
const simulator = modeler.get("simulator");

//
// Demo
//
// enable simulation
simulationSupport.toggleSimulation(true);

// change simulation date
var date = new Date("2000-01-01 00:00:00");
showTime(date);
setTimeout(setTime, 1000, date);

// pause all tasks for simulation
var elements = elementRegistry.filter(function (element) {
  return element.type == "bpmn:Task" || element.type == "bpmn:UserTask";
});
elements.forEach((element) => {
  console.log(element);
  simulationSupport.triggerElement(element.id);
});

// trigger start elements
// var startElements = elementRegistry.filter(function (element) {
//   return element.type == "bpmn:StartEvent";
// });

function trigger(id) {
  simulationSupport.triggerElement(id);
}


// First we need a promisified setTimeout:
function delay (ms) {
    return new Promise((resolve,reject) => setTimeout(resolve,ms));
}


const gatewaySettings = modeler.get("exclusiveGatewaySettings");
var gateway;
var flow;
await delay(1000);
trigger("StartEvent_0offpno");

await delay(1000);
trigger("StartEvent_0offpno");

await delay(1000);
trigger("StartEvent_0offpno");

await delay(1000);
trigger("StartEvent_0offpno");

await delay(1000);
trigger("StartEvent_0offpno");

await delay(1000);
trigger("StartEvent_0offpno");

await delay(1000);
trigger("Task_026c0id");

await delay(1000);
trigger("Task_026c0id");

await delay(1000);
trigger("Task_026c0id");

await delay(1000);
trigger("Task_0po6mda");

await delay(1000);
trigger("Task_026c0id");

await delay(1000);
gateway = elementRegistry.get("ExclusiveGateway_13kuced");
flow = elementRegistry.get("SequenceFlow_091wldx");
gatewaySettings.setSequenceFlow(gateway, flow);

await delay(1000);
trigger("Task_0po6mda");

await delay(1000);
trigger("Task_026c0id");

await delay(1000);
gateway = elementRegistry.get("ExclusiveGateway_13kuced");
flow = elementRegistry.get("SequenceFlow_1qdqk69");
gatewaySettings.setSequenceFlow(gateway, flow);

await delay(1000);
trigger("Task_0po6mda");

await delay(1000);
gateway = elementRegistry.get("ExclusiveGateway_13kuced");
flow = elementRegistry.get("SequenceFlow_091wldx");
gatewaySettings.setSequenceFlow(gateway, flow);

await delay(1000);
trigger("Task_026c0id");

await delay(1000);
trigger("Task_0po6mda");

await delay(1000);
gateway = elementRegistry.get("ExclusiveGateway_13kuced");
flow = elementRegistry.get("SequenceFlow_1qdqk69");
gatewaySettings.setSequenceFlow(gateway, flow);

await delay(1000);
trigger("Task_0po6mda");

trigger("Task_0p47z7h");

await delay(1000);
trigger("Task_0po6mda");

console.log(
  simulator.getConfig(elementRegistry.get("ExclusiveGateway_13kuced"))
);
