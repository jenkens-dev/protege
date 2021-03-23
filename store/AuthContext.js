import React, { useContext, useState, useEffect } from 'react'
import firebase from 'firebase/app'
import { useRouter } from 'next/router'

import { auth } from '../utils/db/index'
import { db } from 'utils/db'

import { useAccountType } from 'store/account-type_store'

const AuthContext = React.createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const router = useRouter()
  const accountType = useAccountType((s) => s.accountType)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(async () => {
    const unsubscribe = await auth.onAuthStateChanged((user) => {
      if (user) {
        const userObject = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          emailVerified: user.emailVerified,
          accountType: user.photoURL,
        }
        setCurrentUser(userObject)
      }
      setIsLoading(false)
    })
    // onAuthStateChanged accepts a function as it's only arguement and returns the unsubscribe function below that will unsubscribe to function originally passed to onAuthStateChanged
    return unsubscribe
  }, [])

  // auth.onAuthStateChanged((user) => {
  //   if (user) {
  //     const userObject = {
  //       uid: user.uid,
  //       displayName: user.displayName,
  //       email: user.email,
  //       emailVerified: user.emailVerified
  //     }
  //     setCurrentUser(userObject)
  //   }
  //   setIsLoading(false)
  // })

  const signup = async (name, email, password, accountType) => {
    const user = await auth
      .createUserWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        if (userCredential) {
          updateUserProfile({
            displayName: name,
            photoURL: accountType,
          })

          // Gets the uid for the users account object
          const uid = userCredential.user.uid

          // Creates document in appropriate collection with matching uid
          await db
            .collection(
              accountType === 'candidate' ? 'candidates' : 'companies'
            )
            .doc(uid)
            .set({
              userUid: uid,
            })
        }
      })
  }

  function updateUserProfile(data) {
    return auth.currentUser.updateProfile(data)
  }

  async function signin(email, password) {
    const signin = await auth
      .signInWithEmailAndPassword(email, password)
      .then((data) => {
        const user = data.user
        router.push(`/${user.photoURL}/${user.displayName}/dashboard`)
      })
    return signin
  }

  function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider()
    return auth.signInWithPopup(provider)
  }

  function signInWithFacebook() {
    var provider = new firebase.auth.FacebookAuthProvider()
    return auth.signInWithPopup(provider)
  }

  function signInWithGithub() {
    var provider = new firebase.auth.GithubAuthProvider()
    return auth.signInWithPopup(provider)
  }

  function signout() {
    setCurrentUser()
    return auth.signOut()
  }

  function resetPassword(email) {
    return auth.sendPasswordResetEmail(email)
  }

  function updateEmail(email) {
    return currentUser.updateEmail(email)
  }

  function updatePassword(password) {
    return currentUser.updatePassword(password)
  }

  const value = {
    currentUser,
    signup,
    signin,
    signInWithGoogle,
    signInWithFacebook,
    signInWithGithub,
    signout,
    resetPassword,
    updateEmail,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  )
}
