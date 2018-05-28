//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

import * as assert from 'assert';
import * as fs from 'fs';
import * as newJavaProject from '../extension';
import * as rmrf from 'rimraf';


function rmfolder(folder: string) {
  if (fs.existsSync(folder)) {
    rmrf(folder, function () {});
  }
}

suite("Extension Tests", function () {

    test("createProjectFile", function() {
        const expected = `<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
  <name>Test-Project</name>
  <comment/>
  <projects/>
  <buildSpec>
    <buildCommand>
      <name>org.eclipse.jdt.core.javabuilder</name>
      <arguments/>
    </buildCommand>
  </buildSpec>
  <natures>
    <nature>org.eclipse.jdt.core.javanature</nature>
  </natures>
</projectDescription>`;
        const actual = newJavaProject.createProjectFile('Test-Project');
        assert.equal(actual, expected);
    });

    test("createClassPathFile", function() {
        const expected = `<?xml version="1.0" encoding="UTF-8"?>
<classpath>
  <classpathentry kind="con" path="org.eclipse.jdt.launching.JRE_CONTAINER/org.eclipse.jdt.internal.debug.ui.launcher.StandardVMType/JavaSE-10">
    <attributes>
      <attribute name="module" value="true"/>
    </attributes>
  </classpathentry>
  <classpathentry kind="src" path="src"/>
  <classpathentry kind="output" path="bin"/>
</classpath>`;
        const actual = newJavaProject.createClassPathFile('JavaSE-10');
        assert.equal(actual, expected);
    });

    test("createProjectFolder", function() {
      rmfolder('/tmp/Test-Project');

      newJavaProject.createProjectFolder('/tmp', 'Test-Project','JavaSE-10');
      assert.equal(fs.existsSync('/tmp/Test-Project'), true);

      const expected = ['src', 'bin', '.classpath', '.project'];
      const actual = fs.readdirSync('/tmp/Test-Project');
      rmfolder('/tmp/Test-Project'); // cleanup
      assert.deepEqual(actual.sort(), expected.sort());
  });
});
