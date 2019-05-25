require('dotenv').config();
import { expect } from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import mocks from '../mocks';
import validatePollTemplate from '../../src/routes/validation/poll-template.post.validate';

const questionTypes = mocks.data.pollTemplate.questionTypes;
const pollTemplate = mocks.data.pollTemplate.pollTemplate;

async function isValid(invalidTemplate) {
  try{
    await validatePollTemplate(invalidTemplate);  
  }
  catch(error){
    return false;
  }
  return true;
}
mocks.data.pollTemplate.pollTemplate.newPollTemplate
describe('Validate Poll Template', () => {

  describe('Validate without questions', () => {
    it('Validate without questions', async () => {
      let valid = false;
      const invalidPollTemplates = pollTemplate.invalidPollTemplates;
      for(let i = 0; i < invalidPollTemplates.length; i++){
        valid = await isValid(invalidPollTemplates[i]);
        if(valid) {
          console.log(`Unexpected that ${i} is valid`);
          break;  
        }
      }
      expect(valid).to.false;
    })
  })

  describe('Validate radiobutton', () => {
    it('Invalid radiobutton structure', async () => {
      let valid = false;
      const invalidRadios = questionTypes.radio.invalid;
      for(let i = 0; i < invalidRadios.length; i++){
        valid = await isValid(invalidRadios[i]);
        if(valid) {
          console.log(`Unexpected that ${i} is valid`);
          break;  
        }
      }
      expect(valid).to.false;
    })

    it('Valid radiobutton structure', async () => {
      const valid = await isValid(questionTypes.radio.valid);
      expect(valid).to.true;
    })

  })

  describe('Validate checkbox', () => {
    it('Invalid checkbox structure', async () => {
      let valid = false;
      const invalidCheckboxes = questionTypes.checkbox.invalid;
      for(let i = 0; i < invalidCheckboxes.length; i++){
        valid = await isValid(invalidCheckboxes[i]);
        if(valid) {
          console.log(`Unexpected that ${i} is valid`);
          break;  
        }
      }
      expect(valid).to.false;
    })

    it('Valid checkbox structure', async () => {
      const valid = await isValid(questionTypes.checkbox.valid);
      expect(valid).to.true;
    })
  })

  describe('Validate linear scale', () => {
    it('Invalid linear scale structure', async () => {
      let valid = false;
      const invalidLinearScales = questionTypes.linearScale.invalid;
      for(let i = 0; i < invalidLinearScales.length; i++){
        valid = await isValid(invalidLinearScales[i]);
        if(valid) {
          console.log(`Unexpected that ${i} is valid`);
          break;  
        }
      }
      expect(valid).to.false;
    })

    it('Valid linear scale structure', async () => {
      const valid = await isValid(questionTypes.linearScale.valid);
      expect(valid).to.true;
    })
  })


})