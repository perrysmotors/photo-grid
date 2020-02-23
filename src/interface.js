import { options } from "./options";

export const form = {};

export function createDialog() {
  var viewWidth = 360;
  var viewHeight = 250;

  // Setup the window
  var dialog = NSAlert.alloc().init();
  dialog.setMessageText("Photo Grid Settings");
  dialog.addButtonWithTitle("Ok");
  dialog.addButtonWithTitle("Cancel");

  // Create the main view
  var view = NSView.alloc().initWithFrame(
    NSMakeRect(0, 0, viewWidth, viewHeight)
  );
  dialog.setAccessoryView(view);

  // --------------------------------------------------------------------------

  // Create labels
  var infoLabel = createTextField(
    "Choose row or column layout and set the layer spacing. Photo Grid will try to keep layers in existing rows or columns.",
    NSMakeRect(0, viewHeight - 40, viewWidth - 10, 40)
  );
  var spacingLabel = createTextField(
    "Spacing:",
    NSMakeRect(0, viewHeight - 70, 200, 20)
  );
  var layoutLabel = createTextField(
    "Layout:",
    NSMakeRect(0, viewHeight - 135, 200, 20)
  );
  var maxWidthLabel = createTextField(
    "Scale and Fit Rows to Fixed Width:",
    NSMakeRect(0, viewHeight - 200, viewWidth - 10, 20)
  );

  // Create textfields
  form.spacingTextField = NSTextField.alloc().initWithFrame(
    NSMakeRect(0, viewHeight - 95, 70, 20)
  );
  form.maxWidthTextField = NSTextField.alloc().initWithFrame(
    NSMakeRect(90, viewHeight - 225, 70, 20)
  );

  // Create radiobuttons
  form.rowsRadioButton = createRadioButton(
    "Rows →",
    NSMakeRect(0, viewHeight - 160, 90, 20)
  );
  form.columnsRadioButton = createRadioButton(
    "Columns ↓",
    NSMakeRect(80, viewHeight - 160, 90, 20)
  );

  // Create checkbox
  form.hasWidthLimitCheckbox = createCheckbox(
    "On",
    NSMakeRect(0, viewHeight - 225, 90, 20)
  );

  // --------------------------------------------------------------------------

  // Set initial input values and enabled states
  form.spacingTextField.setStringValue(String(options.padding));
  form.maxWidthTextField.setStringValue(String(options.maxWidth));

  if (options.hasWidthLimit) {
    form.hasWidthLimitCheckbox.setState(NSOnState);
  } else {
    form.maxWidthTextField.setEnabled(false);
  }

  if (options.isRowLayout) {
    form.rowsRadioButton.setState(NSOnState);
  } else {
    form.columnsRadioButton.setState(NSOnState);
    form.hasWidthLimitCheckbox.setEnabled(false);
    form.maxWidthTextField.setEnabled(false);
  }

  // --------------------------------------------------------------------------

  // Handle Enable / Disable Events
  form.hasWidthLimitCheckbox.setCOSJSTargetFunction(sender => {
    form.maxWidthTextField.setEnabled(sender.state() === NSOnState);
  });

  let radioTargetFunction = sender => {
    let isRowLayout = sender === form.rowsRadioButton;
    let hasWidthLimit = form.hasWidthLimitCheckbox.state() === NSOnState;
    if (isRowLayout) {
      form.hasWidthLimitCheckbox.setEnabled(true);
      form.maxWidthTextField.setEnabled(hasWidthLimit);
    } else {
      form.hasWidthLimitCheckbox.setEnabled(false);
      form.maxWidthTextField.setEnabled(false);
    }
  };

  form.rowsRadioButton.setCOSJSTargetFunction(sender =>
    radioTargetFunction(sender)
  );
  form.columnsRadioButton.setCOSJSTargetFunction(sender =>
    radioTargetFunction(sender)
  );

  // --------------------------------------------------------------------------

  // Add inputs to view
  view.addSubview(infoLabel);
  view.addSubview(spacingLabel);
  view.addSubview(layoutLabel);
  view.addSubview(maxWidthLabel);
  view.addSubview(form.spacingTextField);
  view.addSubview(form.maxWidthTextField);
  view.addSubview(form.rowsRadioButton);
  view.addSubview(form.columnsRadioButton);
  view.addSubview(form.hasWidthLimitCheckbox);

  // --------------------------------------------------------------------------

  // Show the dialog window
  return dialog;
}

function createTextField(stringValue, frame) {
  let textField = NSTextField.alloc().initWithFrame(frame);
  textField.setStringValue(stringValue);
  textField.setSelectable(false);
  textField.setEditable(false);
  textField.setBezeled(false);
  textField.setDrawsBackground(false);
  return textField;
}

function createCheckbox(title, frame) {
  let checkbox = NSButton.alloc().initWithFrame(frame);
  checkbox.setButtonType(NSSwitchButton);
  checkbox.setBezelStyle(0);
  checkbox.setTitle(title);
  return checkbox;
}

function createRadioButton(title, frame) {
  let radioButton = NSButton.alloc().initWithFrame(frame);
  radioButton.setButtonType(NSRadioButton);
  radioButton.setTitle(title);
  return radioButton;
}
