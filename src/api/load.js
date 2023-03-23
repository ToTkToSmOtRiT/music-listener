export default function(instance){
    return{
      loadSongs(){
        return instance.get('/load')
      }
    }
}