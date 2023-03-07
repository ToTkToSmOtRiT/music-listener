export default function(instance){
    return{
        signIn(payLoad){
            return instance.post('auth/sign_in', payLoad)
        },
        signUp(payload){
            return instance.post('auth/sign_up', payload)
        },
        logout(){
            return instance.delete('auth/logout')
        },
    }
}